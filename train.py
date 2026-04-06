from dataloading import load_data
from algorithms.FairVGNN import FairVGNN
from algorithms.FairGNN import FairGNN
from algorithms.GNN import GNN
from metrics_post import compute_post_exposure_metrics
from metrics_recommendation import compute_recommendation_metrics
import scipy.sparse as sp

import json
import time
import numpy as np
from collections import defaultdict
import torch
import random
import argparse

def round_dict_values(obj, decimals=6):
    """Recursively round all float values in a dictionary/list to specified decimal places."""
    if isinstance(obj, dict):
        return {key: round_dict_values(value, decimals) for key, value in obj.items()}
    elif isinstance(obj, list):
        return [round_dict_values(item, decimals) for item in obj]
    elif isinstance(obj, (float, np.floating)):
        return round(float(obj), decimals)
    elif isinstance(obj, (int, np.integer)):
        return int(obj)  # Keep integers as integers
    else:
        return obj


def reorganize_results_dict(results_dict):
    """
    Reorganize results dictionary into clean structure:
    1. Raw graph echo chamber and polarization
    2. GNN model performance and fairness
    3. Pre-exposure metrics (learned graph echo chamber and polarization)
    4. Post-exposure metrics (recommendation quality, fairness, echo chamber, polarization)
    """
    reorganized = {}
    
    for key, value in results_dict.items():
        if key == 'all' or key == 'best':
            reorganized[key] = {}
            for model_dataset, results_list in value.items():
                if isinstance(results_list, list):
                    reorganized[key][model_dataset] = [
                        reorganize_single_result(result) for result in results_list
                    ]
                else:
                    reorganized[key][model_dataset] = reorganize_single_result(results_list)
        else:
            reorganized[key] = value
    
    return reorganized


def reorganize_single_result(result):
    """Reorganize a single result dictionary into clean structure."""
    organized = {
        'raw_graph': {
            'echo_chamber': {}
        },
        'model_performance': {},
        'model_fairness': {},
        'pre_exposure': {
            'echo_chamber': {},
            'opinion_polarization': {}
        },
        'post_exposure': {
            'recommendation_quality': {},
            'recommendation_fairness': {},
            'echo_chamber': {},
            'opinion_polarization': {}
        },
        'validation': {},
        'metadata': {}
    }
    
    # Check if we have recommendation metrics
    has_rec_metrics = any(k.startswith('ACC_rec') or k.startswith('SP_rec') or k.startswith('Exposure_') 
                          for k in result.keys())
    
    # 1. Raw graph echo chamber only (no opinion polarization for raw graph)
    if 'echo_raw' in result:
        organized['raw_graph']['echo_chamber'] = result['echo_raw']
    
    # 2. Model performance metrics
    performance_keys = ['ACC', 'AUCROC', 'F1', 'ACC_sens0', 'AUCROC_sens0','ACC_sens1', 'AUCROC_sens1']
    for key in performance_keys:
        if key in result:
            organized['model_performance'][key] = result[key]
    
    # 3. Model fairness metrics
    fairness_keys = ['SP', 'EO', 'fpr_gap', 'auc_gap', 'decision_polarization']
    for key in fairness_keys:
        if key in result:
            organized['model_fairness'][key] = result[key]
    
    # 4. Pre-exposure metrics (learned graph)
    if 'echo_learned' in result:
        organized['pre_exposure']['echo_chamber'] = result['echo_learned']
    
    # Pre-exposure opinion polarization: same as raw (computed on model predictions)
    # The learned graph uses the same predictions, so polarization is the same
    if 'opinion_polarization' in result and isinstance(result['opinion_polarization'], dict):
        organized['pre_exposure']['opinion_polarization'] = result['opinion_polarization']
    
    # 5. Post-exposure: Recommendation quality
    quality_keys = ['ACC_rec', 'F1_rec', 'AUCROC_rec', 'ACC_rec_sens0', 
                    'AUCROC_rec_sens0', 'ACC_rec_sens1', 'AUCROC_rec_sens1',
                    'NDCG@10', 'AUCROC_exposure', 'AUCROC_exposure_sens0', 'AUCROC_exposure_sens1',
                    'exposure_ytrue_correlation', 'exposure_ytrue_pvalue']
    for key in quality_keys:
        if key in result:
            organized['post_exposure']['recommendation_quality'][key] = result[key]
    
    # 6. Post-exposure: Recommendation fairness
    rec_fairness_keys = ['SP_rec', 'EO_rec', 'Exposure_sens0', 'Exposure_sens1', 
                         'Exposure_Disparity', 'Bias_Amplification']
    for key in rec_fairness_keys:
        if key in result:
            organized['post_exposure']['recommendation_fairness'][key] = result[key]
    
    # 7. Post-exposure: Echo chamber (from recommendation exposure graph)
    # When recommendations are computed, echo chamber metrics overwrite top-level keys
    # So if we have recommendation metrics, the top-level echo chamber metrics are from recommendations
    if has_rec_metrics:
        rec_echo_keys = ['edges_total', 'intra_edges', 'inter_edges', 'p_intra_sens', 
                         'ei_index_sens', 'assort_sens', 'assort_label', 'p_intra_label',
                         'assort_yhat', 'p_intra_yhat']
        rec_echo = {}
        for key in rec_echo_keys:
            if key in result:
                rec_echo[key] = result[key]
        if rec_echo:
            organized['post_exposure']['echo_chamber'] = rec_echo
        
        # 8. Post-exposure: Opinion polarization (from recommendation exposure_count)
        # When recommendations are computed, opinion polarization metrics overwrite top-level keys
        # So if we have recommendation metrics, the top-level polarization metrics are from recommendations
        rec_polar_keys = ['prob_mean', 'prob_var', 'extreme_frac_0.1', 'extreme_frac_0.2',
                          'group_mean_gap', 'js_div_prob_by_sens']
        rec_polar = {}
        for key in rec_polar_keys:
            if key in result:
                rec_polar[key] = result[key]
        if rec_polar:
            organized['post_exposure']['opinion_polarization'] = rec_polar
    
    # Validation metrics
    val_keys = ['val_SP', 'val_EO', 'val_loss']
    for key in val_keys:
        if key in result:
            organized['validation'][key] = result[key]
    
    # Metadata
    metadata_keys = ['time', 'parameter']
    for key in metadata_keys:
        if key in result:
            organized['metadata'][key] = result[key]
    
    return organized

name = ['ACC', 'AUCROC', 'F1', 'ACC_sens0', 'AUCROC_sens0', 'ACC_sens1', 'AUCROC_sens1', 'SP',
        'EO']


# parser = argparse.ArgumentParser(description='')
# parser.add_argument('param1', type=float, help='First scalar parameter')
# parser.add_argument('param2', type=float, help='Second scalar parameter', default=0.0)
# parser.add_argument('use_optimal', type=bool, help='Whether to use optimal parameters', default=False)

parser = argparse.ArgumentParser(description='')
parser.add_argument('--param1', type=float, default=0.0, help='First scalar parameter')
parser.add_argument('--param2', type=float, default=0.0, help='Second scalar parameter')
parser.add_argument('--use_optimal', action='store_true', help='Use optimal parameters from params.json')
args = parser.parse_args()


def setup_seed(seed):
    torch.manual_seed(seed)
    torch.cuda.manual_seed_all(seed)
    torch.backends.cudnn.deterministic = True
    np.random.seed(seed)
    random.seed(seed)


setup_seed(11)

model_name='GNN'
dataset='pokec_z'
save_dict = defaultdict(dict)
save_dict['all'] = defaultdict(list)

if args.use_optimal:
    optimal_params = json.load(open('./param.json'))

    args = argparse.Namespace()
    args.param1 = list(optimal_params[model_name][dataset].values())[0]
    args.param2 = list(optimal_params[model_name][dataset].values())[1]
    args.use_optimal = True

if model_name == 'FairVGNN':
    adj, feats, labels, idx_train, idx_val, idx_test, sens, sens_idx = load_data(dataset,feature_normalize=False)    
    top_k=args.param1
    alpha=args.param2

    val_loss = 1e10

    time_start = time.time()

    model = FairVGNN()

    if dataset in ['pokec_z', 'pokec_n']:
        model.fit(
            adj, feats, labels, idx_train, idx_val, idx_test, sens, sens_idx,
            top_k=top_k,
            alpha=alpha,
            prop='scatter',   # critical: avoids torch.spmm
            encoder='GCN',
            clip_e=1,         # keep stable clipping
            d_epochs=5,
            c_epochs=10,
            g_epochs=10,
            epochs=500,
        )
        import scipy.sparse as sp
        from metrics_echo import echo_polar_metrics
        from metrics_learned_graph import knn_graph
        from metrics_opinion import opinion_polarization

        # --- Convert adjacency safely ---
        # If adj is torch, this works. If it's already scipy sparse, handle that too.
        if sp.issparse(adj):
            adj_sp = adj.tocoo()
        else:
            # torch dense/sparse-like
            adj_sp = sp.coo_matrix(adj.to_dense().cpu().numpy())

        sens_np = sens.cpu().numpy() if hasattr(sens, "cpu") else sens
        labels_np = labels.cpu().numpy() if hasattr(labels, "cpu") else labels

        # --- Get model-induced predictions and embeddings (saved inside FairVGNN) ---
        prob_all = model.best_prob          # shape (N,)
        yhat_all = model.best_yhat          # shape (N,)
        emb_all  = model.best_emb           # shape (N, hidden)

        # 1) RAW graph echo chamber + (model-induced) polarization via predictions
        echo_raw = echo_polar_metrics(adj_sp, sens_np, labels=labels_np, yhat=yhat_all)
        print("\n[RAW GRAPH] Echo/Polar stats:", echo_raw)

        # 2) Opinion polarization proxy from probabilities
        op_stats = opinion_polarization(prob_all, sens=sens_np)
        print("\n[OPINION POLARIZATION] (from predicted probabilities):", op_stats)

        # 3) LEARNED graph echo chamber/polarization on kNN graph from embeddings
        A_learned = knn_graph(emb_all, k=20, metric="cosine")
        echo_learned = echo_polar_metrics(A_learned, sens_np, labels=labels_np, yhat=yhat_all)
        print("\n[PRE-EXPOSURE METRICS:]")
        print("\n[LEARNED GRAPH - kNN(embeddings)] Echo/Polar stats:", echo_learned)

    ACC, AUCROC, F1, ACC_sens0, AUCROC_sens0, F1_sens0, ACC_sens1, AUCROC_sens1, F1_sens1, SP, EO = model.predict()

    # -----------------------------
    # Post-Exposure Metrics (NEW)
    # -----------------------------
    y_hat = model.best_yhat
    y_prob = model.best_prob
    y_true = labels
    
    y_hat_np  = np.asarray(y_hat)
    y_true_np = np.asarray(labels)
    y_prob_np = np.asarray(prob_all)
    sens_np   = np.asarray(sens)

    post_metrics = compute_post_exposure_metrics(
        y_true=y_true_np,
        y_hat=y_hat_np,
        y_prob=y_prob_np,
        sens=sens_np
    )
    # print("\n[POST-EXPOSURE METRICS]")
    for k, v in post_metrics.items():
        print(k, '{:.6f}'.format(v))

    # -----------------------------
    # Recommendation Simulation Metrics
    # -----------------------------

    # Convert adjacency to scipy sparse (needed for rec simulation)
    if not sp.issparse(adj):
        adj_sp = sp.coo_matrix(adj.to_dense().cpu().numpy())
    else:
        adj_sp = adj

    rec_metrics = compute_recommendation_metrics(
        adj=adj_sp,
        embeddings=emb_all,  # Use embeddings for cosine similarity-based recommendations
        sens=sens_np,        # sensitive attribute
        y_true=(y_true_np > 0).astype(float),    # optional: ground-truth labels for NDCG
        top_k=10,            # you can adjust top-k
        exclude_self=True,   # Exclude self from recommendations
        exclude_neighbors=True  # Exclude existing neighbors from recommendations
    )

    print("\n[RECOMMENDATION RESULTS]")
    for k, v in rec_metrics.items():
        print(k, "{:.6f}".format(v))
    # -----------------------------
    temp = {name_one: value_one for name_one, value_one in zip(name, [ACC, AUCROC, F1, ACC_sens0,
                                                                      AUCROC_sens0, F1_sens0,
                                                                      ACC_sens1, AUCROC_sens1,
                                                                      F1_sens1, SP, EO])}
    temp.update(post_metrics)
    temp.update(rec_metrics)  # Add recommendation metrics to results

    
    temp['val_loss'] = model.val_loss
    temp['time'] = time.time() - time_start
    temp['parameter'] = {'top_k': top_k, 'alpha': alpha}
    
    # Add echo chamber and polarization metrics to results dictionary
    if dataset in ['pokec_z', 'pokec_n']:
        temp['echo_raw'] = echo_raw
        temp['opinion_polarization'] = op_stats
        temp['echo_learned'] = echo_learned


    SP, EO = model.predict_val()
    

    temp.update({'val_' + name_one: value_one for name_one, value_one in
                 zip(['SP','EO'], [SP, EO])})

    if model.val_loss < val_loss:
        val_loss = model.val_loss
        save_dict['best'][model_name + '+' + dataset] = temp
    save_dict['all'][model_name + '+' + dataset].append(temp)

    for i, value in enumerate(
            [ACC, AUCROC, F1, ACC_sens0, AUCROC_sens0, ACC_sens1, AUCROC_sens1, SP, EO]):
        print(name[i], '{:.6f}'.format(value))


        # continue

elif model_name == 'FairGNN':
    temp_accs = {'pokec_z': 0.6, 'pokec_n': 0.56}

    adj, feats, labels, idx_train, idx_val, idx_test, sens, sens_idx = load_data(dataset,
                                                                                 feature_normalize=False)
    temp_acc = temp_accs[dataset] - 0.3
    val_loss = 1e10

    alpha=args.param1
    beta=args.param2


    time_start = time.time()
    model = FairGNN(feats.shape[-1], acc=temp_acc, epoch=500, alpha=alpha, beta=beta).cuda()
    model.fit(adj, feats, labels, idx_train, idx_val, idx_test, sens, idx_train)
    
    # Echo chamber and polarization metrics
    import scipy.sparse as sp
    from metrics_echo import echo_polar_metrics
    from metrics_learned_graph import knn_graph
    from metrics_opinion import opinion_polarization

    # --- Convert adjacency safely ---
    # If adj is torch, this works. If it's already scipy sparse, handle that too.
    if sp.issparse(adj):
        adj_sp = adj.tocoo()
    else:
        # torch dense/sparse-like
        adj_sp = sp.coo_matrix(adj.to_dense().cpu().numpy())

    sens_np = sens.cpu().numpy() if hasattr(sens, "cpu") else sens
    labels_np = labels.cpu().numpy() if hasattr(labels, "cpu") else labels

    # --- Get model-induced predictions and embeddings (saved inside FairGNN) ---
    prob_all = model.best_prob          # shape (N,)
    yhat_all = model.best_yhat          # shape (N,)
    emb_all  = model.best_emb           # shape (N, hidden)

    # 1) RAW graph echo chamber + (model-induced) polarization via predictions
    echo_raw = echo_polar_metrics(adj_sp, sens_np, labels=labels_np, yhat=yhat_all)
    print("\n[RAW GRAPH] Echo/Polar stats:", echo_raw)

    # 2) Opinion polarization proxy from probabilities
    op_stats = opinion_polarization(prob_all, sens=sens_np)
    print("\n[OPINION POLARIZATION] (from predicted probabilities):", op_stats)

    # 3) LEARNED graph echo chamber/polarization on kNN graph from embeddings
    A_learned = knn_graph(emb_all, k=20, metric="cosine")
    echo_learned = echo_polar_metrics(A_learned, sens_np, labels=labels_np, yhat=yhat_all)
    print("\n[PRE-EXPOSURE METRICS]:")
    print("\n[LEARNED GRAPH - kNN(embeddings)] Echo/Polar stats:", echo_learned)
    # print("\nGNN MODEL RESULTS:")
    ACC, AUCROC, F1, ACC_sens0, AUCROC_sens0, F1_sens0, ACC_sens1, AUCROC_sens1, F1_sens1, SP, EO = model.predict(
        idx_test)

    # -----------------------------
    # Post-Exposure Metrics (NEW)
    # -----------------------------
    y_hat = model.best_yhat
    y_prob = model.best_prob
    y_true = labels
    
    y_hat_np  = np.asarray(y_hat)
    y_true_np = np.asarray(labels)
    y_prob_np = np.asarray(prob_all)
    sens_np   = np.asarray(sens)

    post_metrics = compute_post_exposure_metrics(
        y_true=y_true_np,
        y_hat=y_hat_np,
        y_prob=y_prob_np,
        sens=sens_np
    )
    # print("\n[POST-EXPOSURE METRICS]")
    for k, v in post_metrics.items():
        print(k, '{:.6f}'.format(v))

    # -----------------------------
    # Recommendation Simulation Metrics
    # -----------------------------

    # Convert adjacency to scipy sparse (needed for rec simulation)
    if not sp.issparse(adj):
        adj_sp = sp.coo_matrix(adj.to_dense().cpu().numpy())
    else:
        adj_sp = adj

    rec_metrics = compute_recommendation_metrics(
        adj=adj_sp,
        embeddings=emb_all,  # Use embeddings for cosine similarity-based recommendations
        sens=sens_np,        # sensitive attribute
        y_true=(y_true_np > 0).astype(float),    # optional: ground-truth labels for NDCG
        top_k=10,            # you can adjust top-k
        exclude_self=True,   # Exclude self from recommendations
        exclude_neighbors=True  # Exclude existing neighbors from recommendations
    )

    print("\n[RECOMMENDATION METRICS]")
    for k, v in rec_metrics.items():
        print(k, "{:.6f}".format(v))
    # -----------------------------

    temp = {name_one: value_one for name_one, value_one in zip(name, [ACC, AUCROC, F1, ACC_sens0,
                                                                      AUCROC_sens0, F1_sens0,
                                                                      ACC_sens1, AUCROC_sens1, F1_sens1, SP, EO])}
    temp.update(post_metrics)
    temp.update(rec_metrics)  # Add recommendation metrics to results                                     
    temp['val_loss'] = model.val_loss
    temp['time'] = time.time() - time_start
    temp['parameter'] = {'alpha': alpha, 'beta': beta}
    
    # Add echo chamber and polarization metrics to results dictionary
    temp['echo_raw'] = echo_raw
    temp['opinion_polarization'] = op_stats
    temp['echo_learned'] = echo_learned

    ACC, AUCROC, F1, ACC_sens0, AUCROC_sens0, F1_sens0, ACC_sens1, AUCROC_sens1, F1_sens1, \
    SP, EO, = model.predict_val(idx_val)

    temp.update({'val_' + name_one: value_one for name_one, value_one in
                 zip(name, [ACC, AUCROC, F1, ACC_sens0,
                            AUCROC_sens0, F1_sens0,
                            ACC_sens1,
                            AUCROC_sens1, F1_sens1,
                            SP, EO])})

    if model.val_loss < val_loss:
        val_loss = model.val_loss
        save_dict['best'][model_name + '+' + dataset] = temp
    save_dict['all'][model_name + '+' + dataset].append(temp)

    for i, value in enumerate(
            [ACC, AUCROC, F1, ACC_sens0, AUCROC_sens0, ACC_sens1, AUCROC_sens1, SP, EO]):
        print(name[i], '{:.6f}'.format(value))

elif model_name == 'GNN':
    adj, feats, labels, idx_train, idx_val, idx_test, sens, sens_idx = load_data(dataset,
                                                                                 feature_normalize=False)
    print(labels)
    val_loss = 1e10

    # Load parameters from param.json if not provided or if use_optimal is True
    if args.use_optimal or args.param1 == 0.0 or args.param2 == 0.0:
        optimal_params = json.load(open('./param.json'))
        num_hidden = int(optimal_params[model_name][dataset]['num_hidden'])
        num_proj_hidden = int(optimal_params[model_name][dataset]['num_proj_hidden'])
    else:
        num_hidden = int(args.param1)
        num_proj_hidden = int(args.param2)

    time_start = time.time()

    model = GNN(adj, feats, labels, idx_train, idx_val, idx_test, sens, sens_idx, num_hidden=num_hidden,
                num_proj_hidden=num_proj_hidden)
    model.fit()
    
    # Echo chamber and polarization metrics
    import scipy.sparse as sp
    from metrics_echo import echo_polar_metrics
    from metrics_learned_graph import knn_graph
    from metrics_opinion import opinion_polarization

    # --- Convert adjacency safely ---
    # If adj is torch, this works. If it's already scipy sparse, handle that too.
    if sp.issparse(adj):
        adj_sp = adj.tocoo()
    else:
        # torch dense/sparse-like
        adj_sp = sp.coo_matrix(adj.to_dense().cpu().numpy())

    sens_np = sens.cpu().numpy() if hasattr(sens, "cpu") else sens
    labels_np = labels.cpu().numpy() if hasattr(labels, "cpu") else labels

    # --- Get model-induced predictions and embeddings (saved inside GNN) ---
    prob_all = model.best_prob          # shape (N,)
    yhat_all = model.best_yhat          # shape (N,)
    emb_all  = model.best_emb           # shape (N, hidden)

    # 1) RAW graph echo chamber + (model-induced) polarization via predictions
    echo_raw = echo_polar_metrics(adj_sp, sens_np, labels=labels_np, yhat=yhat_all)
    print("\n[RAW GRAPH] Echo/Polar stats:", echo_raw)

    # 2) Opinion polarization proxy from probabilities
    op_stats = opinion_polarization(prob_all, sens=sens_np)
    print("\n[OPINION POLARIZATION] (from predicted probabilities):", op_stats)

    # 3) LEARNED graph echo chamber/polarization on kNN graph from embeddings
    A_learned = knn_graph(emb_all, k=20, metric="cosine")
    echo_learned = echo_polar_metrics(A_learned, sens_np, labels=labels_np, yhat=yhat_all)
    print("\n[PRE-EXPOSURE METRICS]:")
    print("\n[LEARNED GRAPH - kNN(embeddings)] Echo/Polar stats:", echo_learned)
    
    ACC, AUCROC, F1, ACC_sens0, AUCROC_sens0, F1_sens0, ACC_sens1, AUCROC_sens1, F1_sens1, SP, EO = model.predict()

    # -----------------------------
    # Post-Exposure Metrics (NEW)
    # -----------------------------
    y_hat = model.best_yhat
    y_prob = model.best_prob
    y_true = labels
    
    y_hat_np  = np.asarray(y_hat)
    y_true_np = np.asarray(labels)
    y_prob_np = np.asarray(prob_all)
    sens_np   = np.asarray(sens)

    post_metrics = compute_post_exposure_metrics(
        y_true=y_true_np,
        y_hat=y_hat_np,
        y_prob=y_prob_np,
        sens=sens_np
    )
    # print("\n[POST-EXPOSURE METRICS]")
    for k, v in post_metrics.items():
        print(k, '{:.6f}'.format(v))

    # -----------------------------
    # Recommendation Simulation Metrics
    # -----------------------------

    # Convert adjacency to scipy sparse (needed for rec simulation)
    if not sp.issparse(adj):
        adj_sp = sp.coo_matrix(adj.to_dense().cpu().numpy())
    else:
        adj_sp = adj

    rec_metrics = compute_recommendation_metrics(
        adj=adj_sp,
        embeddings=emb_all,  # Use embeddings for cosine similarity-based recommendations
        sens=sens_np,        # sensitive attribute
        y_true=(y_true_np > 0).astype(float),    # optional: ground-truth labels for NDCG
        top_k=10,            # you can adjust top-k
        exclude_self=True,   # Exclude self from recommendations
        exclude_neighbors=True  # Exclude existing neighbors from recommendations
    )

    print("\n[RECOMMENDATION METRICS]")
    for k, v in rec_metrics.items():
        print(k, "{:.6f}".format(v))
    # -----------------------------
    temp = {name_one: value_one for name_one, value_one in zip(name, [ACC, AUCROC, F1, ACC_sens0,
                                                                      AUCROC_sens0, F1_sens0,
                                                                      ACC_sens1, AUCROC_sens1,
                                                                      F1_sens1, SP, EO])}
    temp.update(post_metrics)
    temp.update(rec_metrics)  # Add recommendation metrics to results
    temp['val_loss'] = model.val_loss
    temp['time'] = time.time() - time_start
    temp['parameter'] = {'num_hidden': num_hidden, 'num_proj_hidden': num_proj_hidden}
    
    # Add echo chamber and polarization metrics to results dictionary
    temp['echo_raw'] = echo_raw
    temp['opinion_polarization'] = op_stats
    temp['echo_learned'] = echo_learned

    ACC, AUCROC, F1, ACC_sens0, AUCROC_sens0, F1_sens0, ACC_sens1, AUCROC_sens1, F1_sens1, \
    SP, EO, = model.predict_val()

    temp.update({'val_' + name_one: value_one for name_one, value_one in
                 zip(name, [ACC, AUCROC, F1, ACC_sens0,
                            AUCROC_sens0, F1_sens0,
                            ACC_sens1,
                            AUCROC_sens1, F1_sens1,
                            SP, EO])})

    if model.val_loss < val_loss:
        val_loss = model.val_loss
        save_dict['best'][model_name + '+' + dataset] = temp
    save_dict['all'][model_name + '+' + dataset].append(temp)

    for i, value in enumerate(
            [ACC, AUCROC, F1, ACC_sens0, AUCROC_sens0, ACC_sens1, AUCROC_sens1, SP, EO]):
        print(name[i], '{:.6f}'.format(value))

# Round all numeric values to 6 decimal places before saving
save_dict_rounded = round_dict_values(save_dict, decimals=6)

# Reorganize into clean structure
save_dict_organized = reorganize_results_dict(save_dict_rounded)

# Save organized version
json.dump(save_dict_organized, open('./save_dict_{}_organized.json'.format(model_name), 'w'), indent=2)
