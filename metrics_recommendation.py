import numpy as np
import scipy.sparse as sp
from sklearn.metrics import accuracy_score, roc_auc_score, f1_score
from scipy.stats import pearsonr
import torch
import torch.nn.functional as F


# -------------------------------------------------
# Utilities
# -------------------------------------------------

def _to_scipy_adj(adj):
    """
    Ensure adjacency is scipy sparse COO
    """
    if sp.issparse(adj):
        return adj.tocoo()
    else:
        raise ValueError("Adjacency must be scipy sparse")


def build_neighbor_list(adj):
    """
    Convert adjacency matrix to neighbor list
    """
    adj = _to_scipy_adj(adj)
    neighbors = [[] for _ in range(adj.shape[0])]

    for i, j in zip(adj.row, adj.col):
        neighbors[i].append(j)

    return neighbors


# -------------------------------------------------
# Recommendation Simulation
# -------------------------------------------------

def cosine_similarity_matrix(embeddings):
    """
    Compute pairwise cosine similarity matrix for embeddings.
    GPU-accelerated version if CUDA is available.
    
    Parameters
    ----------
    embeddings : np.ndarray or torch.Tensor (N, d)
        Node embeddings
    
    Returns
    -------
    similarity : np.ndarray (N, N)
        Cosine similarity matrix
    """
    # Check if CUDA is available and use GPU if possible
    use_gpu = torch.cuda.is_available()
    
    if use_gpu:
        # Convert to torch tensor and move to GPU
        if isinstance(embeddings, np.ndarray):
            embeddings_tensor = torch.from_numpy(embeddings).float().cuda()
        elif isinstance(embeddings, torch.Tensor):
            embeddings_tensor = embeddings.float().cuda()
        else:
            embeddings_tensor = torch.tensor(embeddings, dtype=torch.float32).cuda()
        
        # Normalize embeddings on GPU
        embeddings_norm = F.normalize(embeddings_tensor, p=2, dim=1)
        
        # Compute cosine similarity: matrix multiplication on GPU
        similarity = torch.mm(embeddings_norm, embeddings_norm.t())
        
        # Convert back to numpy
        similarity = similarity.cpu().numpy()
    else:
        # CPU fallback
        if isinstance(embeddings, torch.Tensor):
            embeddings = embeddings.cpu().numpy()
        
        # Normalize embeddings
        norms = np.linalg.norm(embeddings, axis=1, keepdims=True)
        norms[norms == 0] = 1  # Avoid division by zero
        embeddings_norm = embeddings / norms
        
        # Compute cosine similarity: dot product of normalized vectors
        similarity = np.dot(embeddings_norm, embeddings_norm.T)
    
    return similarity


def simulate_graph_recommendations_embedding(embeddings, adj=None, top_k=10, exclude_self=True, exclude_neighbors=True):
    """
    Simulate personalized graph-based recommendations using embedding cosine similarity.
    GPU-accelerated version with memory-efficient batched computation.

    For each user, select top-k most similar nodes based on cosine similarity.
    Optionally exclude self and existing neighbors.

    Parameters
    ----------
    embeddings : np.ndarray or torch.Tensor (N, d)
        Node embeddings
    adj : scipy sparse matrix (N x N), optional
        Graph adjacency matrix (for excluding existing neighbors)
    top_k : int
        Number of recommendations per user
    exclude_self : bool
        If True, exclude the user itself from recommendations
    exclude_neighbors : bool
        If True, exclude existing neighbors from recommendations

    Returns
    -------
    recs : dict
        recs[u] = list of recommended node indices
    """
    # Check if CUDA is available
    use_gpu = torch.cuda.is_available()
    
    # Convert to torch tensor
    if isinstance(embeddings, np.ndarray):
        embeddings_tensor = torch.from_numpy(embeddings).float()
    elif isinstance(embeddings, torch.Tensor):
        embeddings_tensor = embeddings.float()
    else:
        embeddings_tensor = torch.tensor(embeddings, dtype=torch.float32)
    
    n_nodes = embeddings_tensor.shape[0]
    device = 'cuda' if use_gpu else 'cpu'
    
    # Move to GPU if available
    if use_gpu:
        embeddings_tensor = embeddings_tensor.cuda()
    
    # Normalize embeddings once (N, d)
    embeddings_norm = F.normalize(embeddings_tensor, p=2, dim=1)
    
    # Build neighbor list if needed (for CPU-based exclusion)
    neighbors = None
    if exclude_neighbors and adj is not None:
        neighbors = build_neighbor_list(adj)
    
    # Memory-efficient approach: compute similarities in batches without storing full N×N matrix
    # Process users in batches to avoid OOM
    batch_size = 1000  # Process 1000 users at a time
    recs = {}
    
    for batch_start in range(0, n_nodes, batch_size):
        batch_end = min(batch_start + batch_size, n_nodes)
        batch_indices = torch.arange(batch_start, batch_end, device=device)
        
        # Get embeddings for this batch of users (batch_size, d)
        batch_embeddings = embeddings_norm[batch_start:batch_end]  # (batch_size, d)
        
        # Compute similarity: batch_embeddings @ all_embeddings.T = (batch_size, N)
        # This is much more memory efficient than storing full N×N matrix
        batch_similarities = torch.mm(batch_embeddings, embeddings_norm.t())  # (batch_size, N)
        
        # Exclude self
        if exclude_self:
            batch_similarities[torch.arange(len(batch_indices), device=device), 
                              batch_indices] = -torch.inf
        
        # Exclude neighbors (do this on CPU to save GPU memory)
        if exclude_neighbors and neighbors is not None:
            batch_similarities_cpu = batch_similarities.cpu()
            for i, u in enumerate(batch_indices.cpu().numpy()):
                nbrs = neighbors[int(u)]
                if len(nbrs) > 0:
                    batch_similarities_cpu[i, nbrs] = -torch.inf
            batch_similarities = batch_similarities_cpu.to(device)
        
        # Top-k selection on GPU (much faster than sorting!)
        top_k_actual = min(top_k, n_nodes - (1 if exclude_self else 0))
        _, top_indices = torch.topk(batch_similarities, k=top_k_actual, dim=1)
        
        # Convert to CPU and store
        top_indices_cpu = top_indices.cpu().numpy()
        batch_indices_cpu = batch_indices.cpu().numpy()
        for i, u in enumerate(batch_indices_cpu):
            recs[int(u)] = top_indices_cpu[i].tolist()
        
        # Clear GPU cache periodically
        if use_gpu and (batch_start // batch_size) % 10 == 0:
            torch.cuda.empty_cache()
    
    return recs


def simulate_graph_recommendations(adj, scores, top_k=10):
    """
    Simulate personalized graph-based recommendations (legacy: score-based).

    Each node recommends its top-K neighbors ranked by `scores`.

    Parameters
    ----------
    adj : scipy sparse matrix (N x N)
        Graph adjacency matrix
    scores : np.ndarray (N,)
        Predicted relevance score per node
    top_k : int

    Returns
    -------
    recs : dict
        recs[u] = list of recommended node indices
    """
    neighbors = build_neighbor_list(adj)
    recs = {}

    for u, nbrs in enumerate(neighbors):
        if len(nbrs) == 0:
            recs[u] = []
            continue

        nbrs = np.asarray(nbrs)
        nbr_scores = scores[nbrs]

        k = min(top_k, len(nbrs))
        top_idx = np.argsort(-nbr_scores)[:k]
        recs[u] = nbrs[top_idx].tolist()

    return recs


def simulate_global_recommendations(scores, top_k=10):
    """
    Global feed-style recommendation (same for all users)
    """
    ranked = np.argsort(-scores)
    return ranked[:top_k].tolist()


# -------------------------------------------------
# Exposure Metrics
# -------------------------------------------------

def group_exposure_from_recs(recs, sens):
    """
    Compute average exposure per sensitive group.

    Parameters
    ----------
    recs : dict
        Output of simulate_graph_recommendations
    sens : np.ndarray (N,)
        Sensitive attribute (0/1)

    Returns
    -------
    exposure : dict
        exposure[g] = mean exposure of group g
    """
    groups = np.unique(sens)
    exposure = {g: [] for g in groups}

    for u, items in recs.items():
        if len(items) == 0:
            continue

        items = np.asarray(items)
        for g in groups:
            exposure[g].append(np.mean(sens[items] == g))

    return {g: float(np.mean(exposure[g])) if len(exposure[g]) > 0 else 0.0
            for g in groups}


def exposure_disparity(exposure):
    """
    Absolute exposure gap between two groups
    """
    groups = sorted(exposure.keys())
    return abs(exposure[groups[0]] - exposure[groups[1]])


def bias_amplification(exposure, sens):
    """
    Exposure disparity minus base rate disparity
    """
    base = {g: np.mean(sens == g) for g in np.unique(sens)}
    base_gap = abs(base[0] - base[1])

    return exposure_disparity(exposure) - base_gap


# -------------------------------------------------
# Ranking Quality (Optional but recommended)
# -------------------------------------------------

def ndcg_at_k(recs, y_true, k=10):
    """
    Compute NDCG@K for node-level recommendations.

    Relevance = y_true (binary or continuous)

    Returns
    -------
    mean NDCG@K
    """
    def dcg(scores):
        scores = np.asarray(scores, dtype=float)  # <- ensure float
        scores[scores < 0] = 0.0                  # <- clip negatives
        return np.sum((2 ** scores - 1) / np.log2(np.arange(2, len(scores) + 2)))


    ndcgs = []

    for u, items in recs.items():
        if len(items) == 0:
            continue

        rel = y_true[items][:k]
        ideal = np.sort(rel)[::-1]

        denom = dcg(ideal)
        if denom == 0:
            continue

        ndcgs.append(dcg(rel) / denom)

    return float(np.mean(ndcgs)) if len(ndcgs) > 0 else 0.0


# -------------------------------------------------
# Recommendation-based Fairness Metrics
# -------------------------------------------------

def build_exposure_graph(recs, n_nodes):
    """
    Build adjacency matrix from recommendations (exposure graph).
    
    Edge (u, v) exists if user u recommends item v.
    This creates a directed graph of recommendation exposure.
    
    Parameters
    ----------
    recs : dict
        recs[u] = list of recommended node indices
    n_nodes : int
        Total number of nodes
    
    Returns
    -------
    adj_exposure : scipy.sparse.coo_matrix
        Adjacency matrix of the exposure graph (directed)
    """
    rows = []
    cols = []
    
    for u, items in recs.items():
        for v in items:
            rows.append(u)
            cols.append(v)
    
    if len(rows) == 0:
        # Return empty sparse matrix
        return sp.coo_matrix((n_nodes, n_nodes))
    
    data = np.ones(len(rows), dtype=int)
    adj_exposure = sp.coo_matrix((data, (rows, cols)), shape=(n_nodes, n_nodes))
    
    return adj_exposure


def recommendation_binary_outcome(recs, n_nodes):
    """
    Create binary indicator: was each node recommended to at least one user?
    
    Parameters
    ----------
    recs : dict
        recs[u] = list of recommended node indices
    n_nodes : int
        Total number of nodes
    
    Returns
    -------
    rec_binary : np.ndarray (n_nodes,)
        1 if node was recommended to at least one user, 0 otherwise
    """
    rec_binary = np.zeros(n_nodes, dtype=int)
    for u, items in recs.items():
        if len(items) > 0:
            rec_binary[items] = 1
    return rec_binary


def recommendation_exposure_count(recs, n_nodes):
    """
    Count how many times each node appears in recommendation lists.
    
    Parameters
    ----------
    recs : dict
        recs[u] = list of recommended node indices
    n_nodes : int
        Total number of nodes
    
    Returns
    -------
    exposure_count : np.ndarray (n_nodes,)
        exposure_count[i] = number of times node i appears in recommendation lists
    """
    exposure_count = np.zeros(n_nodes, dtype=int)
    for u, items in recs.items():
        if len(items) > 0:
            for item in items:
                exposure_count[item] += 1
    return exposure_count


def compute_recommendation_fairness_metrics(recs, sens, y_true=None, n_nodes=None):
    """
    Compute SP, EO, ACC, AUCROC, F1 on recommendations.
    
    For SP/EO: Based on exposure (who gets recommended)
    - SP_rec: Gap in recommendation rates between sensitive groups
    - EO_rec: Gap in recommendation rates for positive class (if y_true provided)
    
    For ACC/AUCROC/F1: Treat y_true as ground truth labels to evaluate recommendation quality
    - Measures how well recommendations match true positive labels
    
    Parameters
    ----------
    recs : dict
        recs[u] = list of recommended node indices
    sens : np.ndarray (n_nodes,)
        Sensitive attribute
    y_true : np.ndarray (n_nodes,), optional
        Ground truth labels (for EO, ACC, AUCROC, F1 computation)
    n_nodes : int, optional
        Total number of nodes (inferred from sens if not provided)
    
    Returns
    -------
    metrics : dict
    """
    if n_nodes is None:
        n_nodes = len(sens)
    
    # Create binary recommendation outcome (who gets recommended)
    rec_binary = recommendation_binary_outcome(recs, n_nodes)
    sens = np.asarray(sens)
    
    metrics = {}
    
    # Statistical Parity (SP) on recommendations
    # Gap in recommendation rates between groups
    sp0 = rec_binary[sens == 0].mean() if np.any(sens == 0) else np.nan
    sp1 = rec_binary[sens == 1].mean() if np.any(sens == 1) else np.nan
    metrics['SP_rec'] = abs(sp0 - sp1) if not (np.isnan(sp0) or np.isnan(sp1)) else np.nan
    
    # Equality of Opportunity (EO) on recommendations
    # Gap in recommendation rates for positive class between groups
    if y_true is not None:
        y_true = np.asarray(y_true)
        tpr0_idx = (y_true == 1) & (sens == 0)
        tpr1_idx = (y_true == 1) & (sens == 1)
        tpr0 = rec_binary[tpr0_idx].mean() if np.any(tpr0_idx) else np.nan
        tpr1 = rec_binary[tpr1_idx].mean() if np.any(tpr1_idx) else np.nan
        metrics['EO_rec'] = abs(tpr0 - tpr1) if not (np.isnan(tpr0) or np.isnan(tpr1)) else np.nan
        
        # Compute exposure count (number of times each node is recommended)
        exposure_count = recommendation_exposure_count(recs, n_nodes)
        
        # Quality proxy: Correlation between exposure_count and y_true
        try:
            correlation, p_value = pearsonr(exposure_count, y_true)
            metrics['exposure_ytrue_correlation'] = correlation
            metrics['exposure_ytrue_pvalue'] = p_value
        except:
            metrics['exposure_ytrue_correlation'] = np.nan
            metrics['exposure_ytrue_pvalue'] = np.nan
        
        # Quality proxy: AUROC using exposure_count as score
        try:
            metrics['AUCROC_exposure'] = roc_auc_score(y_true, exposure_count)
        except ValueError:
            metrics['AUCROC_exposure'] = np.nan
        
        # Per-group AUROC using exposure_count
        for g in [0, 1]:
            idx = sens == g
            if np.any(idx):
                try:
                    metrics[f'AUCROC_exposure_sens{g}'] = roc_auc_score(y_true[idx], exposure_count[idx])
                except ValueError:
                    metrics[f'AUCROC_exposure_sens{g}'] = np.nan
            else:
                metrics[f'AUCROC_exposure_sens{g}'] = np.nan
        
        # ACC, F1, AUCROC on recommendations (binary: recommended or not)
        # Treat y_true as ground truth: how well do recommendations match true labels?
        metrics['ACC_rec'] = accuracy_score(y_true, rec_binary)
        metrics['F1_rec'] = f1_score(y_true, rec_binary, average='binary', zero_division=0)
        
        try:
            metrics['AUCROC_rec'] = roc_auc_score(y_true, rec_binary)
        except ValueError:
            metrics['AUCROC_rec'] = np.nan
        
        # Per-group ACC, F1, AUCROC
        for g in [0, 1]:
            idx = sens == g
            if np.any(idx):
                metrics[f'ACC_rec_sens{g}'] = accuracy_score(y_true[idx], rec_binary[idx])
                metrics[f'F1_rec_sens{g}'] = f1_score(y_true[idx], rec_binary[idx], average='binary', zero_division=0)
                try:
                    metrics[f'AUCROC_rec_sens{g}'] = roc_auc_score(y_true[idx], rec_binary[idx])
                except ValueError:
                    metrics[f'AUCROC_rec_sens{g}'] = np.nan
            else:
                metrics[f'ACC_rec_sens{g}'] = np.nan
                metrics[f'F1_rec_sens{g}'] = np.nan
                metrics[f'AUCROC_rec_sens{g}'] = np.nan
    
    return metrics


# -------------------------------------------------
# Master Evaluation Function
# -------------------------------------------------

def compute_recommendation_metrics(
    adj,
    embeddings=None,
    scores=None,
    sens=None,
    y_true=None,
    top_k=10,
    exclude_self=True,
    exclude_neighbors=True
):
    """
    Full recommendation fairness evaluation.
    
    Uses embedding-based recommendations (cosine similarity) if embeddings provided,
    otherwise falls back to score-based recommendations.
    
    Computes:
    1. Exposure metrics (exposure disparity, bias amplification)
    2. Recommendation fairness (SP_rec, EO_rec)
    3. Echo chamber metrics on recommendation exposure graph
    4. Opinion polarization on recommendation outcomes
    5. NDCG (if y_true provided)

    Parameters
    ----------
    adj : scipy sparse matrix (N x N)
        Graph adjacency matrix
    embeddings : np.ndarray (N, d), optional
        Node embeddings for embedding-based recommendations
    scores : np.ndarray (N,), optional
        Predicted scores (used if embeddings not provided)
    sens : np.ndarray (N,)
        Sensitive attribute
    y_true : np.ndarray (N,), optional
        Ground truth labels
    top_k : int
        Number of recommendations per user
    exclude_self : bool
        Exclude self from recommendations (embedding-based only)
    exclude_neighbors : bool
        Exclude existing neighbors from recommendations (embedding-based only)

    Returns
    -------
    metrics : dict
    """
    # Use embedding-based recommendations if embeddings provided
    if embeddings is not None:
        recs = simulate_graph_recommendations_embedding(
            embeddings, adj, top_k=top_k, 
            exclude_self=exclude_self, 
            exclude_neighbors=exclude_neighbors
        )
        # Use embeddings for opinion polarization (same as pre-exposure)
        scores_for_polarization = None  # Will use embeddings-based scores
    elif scores is not None:
        recs = simulate_graph_recommendations(adj, scores, top_k=top_k)
        scores_for_polarization = scores
    else:
        raise ValueError("Either embeddings or scores must be provided")
    
    n_nodes = len(sens)

    # 1. Exposure metrics
    exposure = group_exposure_from_recs(recs, sens)
    disparity = exposure_disparity(exposure)
    amplification = bias_amplification(exposure, sens)

    metrics = {
        "Exposure_sens0": exposure.get(0, 0.0),
        "Exposure_sens1": exposure.get(1, 0.0),
        "Exposure_Disparity": disparity,
        "Bias_Amplification": amplification,
    }

    # 2. Recommendation fairness metrics (SP/EO on who gets recommended)
    rec_fairness = compute_recommendation_fairness_metrics(recs, sens, y_true, n_nodes)
    metrics.update(rec_fairness)

    # 3. Build exposure graph and compute echo chamber metrics
    # Same computation as pre-exposure: echo_polar_metrics(adj, sens, labels, yhat)
    from metrics_echo import echo_polar_metrics
    adj_exposure = build_exposure_graph(recs, n_nodes)
    
    # Create binary recommendation outcome (who gets recommended) for yhat
    rec_binary = recommendation_binary_outcome(recs, n_nodes)
    
    # Compute echo chamber metrics on exposure graph
    # Format: echo_polar_metrics(adj, sens, labels, yhat) - same as pre-exposure
    echo_rec = echo_polar_metrics(adj_exposure, sens, labels=y_true, yhat=rec_binary)
    
    # Store with same keys as pre-exposure for consistency
    metrics.update(echo_rec)

    # 4. Opinion polarization on recommendation exposure_count
    # Same computation as pre-exposure: opinion_polarization(prob, sens)
    # Use exposure_count (how often each node appears in top-k lists) as the signal
    from metrics_opinion import opinion_polarization
    exposure_count = recommendation_exposure_count(recs, n_nodes)
    
    op_rec = opinion_polarization(exposure_count, sens=sens)
    
    # Store with same keys as pre-exposure for consistency
    metrics.update(op_rec)

    # 5. NDCG (if ground truth provided)
    if y_true is not None:
        metrics["NDCG@{}".format(top_k)] = ndcg_at_k(recs, y_true, k=top_k)

    return metrics
