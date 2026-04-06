import numpy as np
import networkx as nx
import matplotlib.pyplot as plt
from matplotlib.lines import Line2D
from scipy.sparse import coo_matrix
import scipy.sparse as sp
import torch
import torch.nn as nn
import os
from sklearn.linear_model import LinearRegression
import requests
import json
import time
import random

# -------------------------------------------------
# IMPORTS: GNNExplainer Check
# -------------------------------------------------
# We wrap this in a try-except block to ensure the code doesn't crash 
# if torch_geometric is missing. It will gracefully degrade to the Surrogate method.
try:
    from torch_geometric.explain import Explainer, GNNExplainer, ModelConfig
    GNN_EXPLAINER_AVAILABLE = True
except ImportError:
    GNN_EXPLAINER_AVAILABLE = False
    print(" [Warning] torch_geometric.explain not found. Feature attribution will use Surrogate only.")

# -------------------------------------------------
# UTILITIES
# -------------------------------------------------
def find_model_recursive(obj, depth=0, max_depth=2):
    """
    Recursively searches an object to find the inner PyTorch nn.Module.
    Useful when the model is wrapped in other classes (like ModelWrapper).
    """
    if depth > max_depth: return None
    if isinstance(obj, nn.Module): return obj
    if hasattr(obj, '__dict__'):
        for k, v in obj.__dict__.items():
            if isinstance(v, nn.Module):
                return v
            if isinstance(v, (list, tuple)):
                for item in v:
                    res = find_model_recursive(item, depth+1, max_depth)
                    if res: return res
            if isinstance(v, dict):
                for val in v.values():
                    res = find_model_recursive(val, depth+1, max_depth)
                    if res: return res
    return None

def find_mask_recursive(model):
    """
    Recursively searches for a 'feature mask' attribute (e.g., 'best_feat_mask') 
    inside the model. This is used to visualize what the model learned during training.
    """
    if model is None:
        return None
    search_terms = ['best_feat_mask', 'feat_mask', 'mask', 'feature_weights', 'best_mask', 'attn_drop', 'att']
    
    # 1. Check top level first
    for term in search_terms:
        if hasattr(model, term):
            return getattr(model, term)
            
    # 2. Check sub-modules
    if hasattr(model, 'named_modules'):
        for name, module in model.named_modules():
            for term in search_terms:
                if hasattr(module, term):
                    return getattr(module, term)
                    
    # 3. Check internal dictionary (fallback)
    if hasattr(model, '__dict__'):
        for k in model.__dict__:
            if k in search_terms:
                return model.__dict__[k]
    return None

def get_feature_names(dataset_name, num_feats):
    """
    Attempts to load human-readable feature names from text files.
    If unavailable, it generates generic names like 'Feature_0', 'Feature_1'.
    """
    paths = [
        f"./dataset/{dataset_name}/feature_names.txt",
        f"./dataset/feature_names.txt",
        "feature_names.txt"
    ]
    for path in paths:
        if os.path.exists(path):
            print(f" [Info] Loading feature names from: {path}")
            try:
                with open(path, 'r') as f:
                    names = [line.strip() for line in f.readlines()]
                if len(names) == num_feats: return names
            except: pass
    return [f"Feature_{i}" for i in range(num_feats)]

def map_features(top_indices, contributions, feature_names=None):
    """
    Maps the indices of the top features to their names and scores.
    Returns a dictionary: {'Age': 0.45, 'Income': -0.2, ...}
    """
    results = {}
    for i in top_indices:
        val = float(contributions[i])
        key = f"{feature_names[i]}" if feature_names and i < len(feature_names) else f"Feature {i}"
        results[key] = val
    return results

# -------------------------------------------------
# CORE EXPLAINABILITY FUNCTIONS
# -------------------------------------------------
def explain_connectivity(u_idx, v_idx, adj):
    """
    Checks the Adjacency Matrix to see if two users are directly connected.
    """
    if not isinstance(adj, coo_matrix): adj = adj.tocoo()
    row_mask = (adj.row == u_idx)
    neighbors_of_u = adj.col[row_mask]
    if v_idx in neighbors_of_u:
        return f"Direct Connection: User {u_idx} is connected to {v_idx}."
    return f"No direct connection (Latent similarity recommended)."

def explain_score_ranking(u_idx, rec_list, all_scores):
    """
    Analyzes the prediction scores to explain why these specific items were ranked top.
    """
    explanations = {}
    avg = np.mean(all_scores)
    for item in rec_list:
        val = all_scores[item]
        explanations[item] = {"score": float(val), "diff_from_avg": float(val - avg)}
    return explanations

def audit_rec_fairness(u_idx, rec_list, sens):
    """
    Audits the recommendation list for 'Homophily' (Echo Chamber Risk).
    Calculates what percentage of recommendations belong to the same group as the user.
    """
    u_sens = sens[u_idx]
    counts = {0: 0, 1: 0}
    for r in rec_list:
        if sens[r] in counts: counts[sens[r]] += 1
    homophily = counts.get(u_sens, 0) / len(rec_list) if rec_list else 0
    return {"user_group": int(u_sens), "rec_composition": counts, "homophily_ratio": homophily}

def explain_feature_importance_surrogate(features, scores, target_idx, feature_names=None):
    """
    Fallback Method: Uses Linear Regression (LIME-like approach) to approximate feature importance.
    Used when GNNExplainer fails or is unavailable.
    """
    if torch.is_tensor(features): X = features.cpu().numpy()
    else: X = features
    
    # --- CRITICAL FIX: Flatten the scores array ---
    # Previous error: IndexError due to shape mismatch (e.g., (255, 1) vs (255,))
    # We flatten 'scores' to ensure it is a 1D array.
    y = scores.flatten()
    
    # Fit Linear Model to approximate the relationship between Features (X) and Scores (y)
    reg = LinearRegression().fit(X, y)
    
    # --- CRITICAL FIX: Flatten coefficients ---
    # Ensure coefficients are 1D so we can multiply them element-wise with features
    coefs = reg.coef_.flatten()
    
    # Calculate contribution: Feature Value * Learned Weight
    contribution = X[target_idx] * coefs
    
    # Flatten result to be safe
    contribution = contribution.flatten()
    
    # Sort and return top 5 features
    top_indices = np.argsort(-np.abs(contribution))[:5]
    return map_features(top_indices, contribution, feature_names)

# -------------------------------------------------
# UPDATED: GNNExplainer Implementation
# -------------------------------------------------
def explain_feature_importance(model, features, adj_tensor, target_node_idx, feature_names=None):
    """
    Computes feature importance using GNNExplainer.
    1. Tries to use GNNExplainer (Node Masking).
    2. Falls back to Linear Surrogate if any error occurs.
    """
    if model is None: return None

    # 1. Fallback check: If library missing, go to Surrogate immediately.
    if not GNN_EXPLAINER_AVAILABLE:
        print(" [Explain] GNNExplainer unavailable. Using Surrogate.")
        with torch.no_grad():
            scores = model(features, adj_tensor).detach().cpu().numpy()
        return explain_feature_importance_surrogate(features, scores, target_node_idx, feature_names)

    # 2. Configure GNNExplainer
    # We create an instance of the Explainer class.
    # - return_type='raw': Because FairVGNN outputs logits (before Sigmoid).
    # - edge_mask_type=None: CRITICAL FIX. We disable edge masking because pre-computed 
    #   adjacency matrices (like adj_norm_sp) break gradient flow for edge weights.
    explainer = Explainer(
        model=model,
        algorithm=GNNExplainer(epochs=100), 
        explanation_type='model',
        node_mask_type='attributes',
        edge_mask_type=None,  # <--- FIXED: Disabled to prevent gradient error
        model_config=ModelConfig(
            mode='binary_classification', 
            task_level='node', 
            return_type='raw' 
        ),
    )

    try:
        # 3. Run Explanation
        # We pass the features (x) and the graph structure (edge_index).
        explanation = explainer(
            x=features, 
            edge_index=adj_tensor, 
            index=target_node_idx
        )

        # 4. Extract Feature Mask
        # The explanation object contains a 'node_mask' showing feature importance.
        # Shape is typically [num_nodes, num_features] or [1, num_features].
        node_mask = explanation.node_mask
        
        # Handle different output shapes safely
        if node_mask.dim() == 2 and node_mask.shape[0] > 1:
            # If mask covers all nodes, pick the row for the target user
            attr = node_mask[target_node_idx]
        else:
            # If mask is already specific to the subgraph/node
            attr = node_mask.squeeze()

        node_attr = attr.detach().cpu().numpy()

        # 5. Format Output
        # Sort by absolute importance value and return the top 5
        top_indices = np.argsort(-np.abs(node_attr))[:5]
        return map_features(top_indices, node_attr, feature_names)

    except Exception as e:
        # If GNNExplainer fails (e.g. OOM, graph structure issue), log warning and fallback.
        print(f" [Warning] GNNExplainer failed: {str(e)}")
        print(" [Fallback] Switching to Linear Surrogate...")
        
        # Calculate raw scores to pass to surrogate
        with torch.no_grad():
            scores = model(features, adj_tensor).detach().cpu().numpy()
        return explain_feature_importance_surrogate(features, scores, target_node_idx, feature_names)

# -------------------------------------------------
# LLM INTEGRATION
# -------------------------------------------------
def get_human_readable_explanation(context_data, report_type="standard", model_name="llama3.2"):
    """
    Sends structured audit data to a local LLM (Ollama) to generate a text report.
    Supports different personas: Compliance Officer, Trust & Safety, or Auditor.
    """
    url = "http://localhost:11434/api/generate"
    
    # 1. Select Prompt based on Report Type
    if report_type == "compliance":
        prompt = f"""
        Act as a Chief AI Risk Officer. Review the following system metrics:
        - **Model Accuracy:** {context_data['acc']:.4f} (Baseline threshold > 0.65)
        - **Statistical Parity Gap:** {context_data['sp']:.4f} (Ideally < 0.05)
        - **Bias Amplification:** {context_data['amp']:.4f} (Ideally ~0.0)
        **Task:** Write a formal 'Regulatory Compliance Memo'.
        1. **Verdict:** Can we deploy? (Yes/No/Conditional)
        2. **Risk Assessment:** Assess the fairness vs. utility trade-off.
        3. **Recommendation:** Suggest next steps (e.g., Retrain, Deploy, Audit).
        Keep it professional, concise, and executive-level.
        """
    elif report_type == "echo_chamber":
        prompt = f"""
        Act as a Trust & Safety Analyst. You are auditing a specific user for 'Filter Bubble' risks.
        - **Target User ID:** {context_data['user_id']}
        - **Sensitive Group:** {context_data['user_group']}
        - **Recommendation Homophily Ratio:** {context_data['homophily']:.2f} (1.0 = Pure Echo Chamber)
        **Task:** Write a 'Risk Alert' for this user.
        1. **Bubble Check:** Is this user in an echo chamber?
        2. **Diversity Score:** Are they seeing diverse content?
        3. **Action:** Suggest an intervention if risk is high.
        """
    else: # Standard "Why this recommendation?"
        prompt = f"""
        You are an AI Fairness Auditor explaining a recommendation system's decision to a stakeholder.
        Here is the technical audit data for a specific recommendation:
        1. SCENARIO:
        - Target User ID: {context_data.get('user_id', 'Unknown')}
        - Recommended Item ID: {context_data.get('rec_item', 'Unknown')}
        - Prediction Score: {context_data.get('score', 0):.4f} (Confidence)
        2. STRUCTURAL REASON (The 'Who'):
        - {context_data.get('structure', '')}
        3. FAIRNESS IMPACT (The 'Risk'):
        - The user belongs to Sensitive Group {context_data.get('user_group', 0)}.
        - The recommendation contributes to a Homophily Ratio of {context_data.get('homophily', 0):.2f}.
        (Note: >0.8 usually implies an echo chamber).
        4. FEATURE ATTRIBUTION (The 'Why'):
        - Top features pushing this recommendation UP: {context_data.get('top_positive_features', [])}
        - Top features pushing this recommendation DOWN: {context_data.get('top_negative_features', [])}
        TASK:
        Write a short, clear, human-readable paragraph explaining why this item was recommended.
        Highlight the key driver (features or structure) and mention if there is a fairness concern (echo chamber).
        Avoid using technical jargon like "adjacency matrix" or "gradient". Use natural language.
        """

    payload = {
        "model": model_name,
        "prompt": prompt,
        "stream": False
    }

    if report_type == "standard":
        print(" [LLM] Consulting Llama 3.2 for explanation... (this may take a few seconds)")
        
    try:
        response = requests.post(url, json=payload)
        response.raise_for_status()
        result = response.json()
        return result.get('response', "No response generated.")
    except requests.exceptions.ConnectionError:
        return "Error: Could not connect to Ollama. Is 'ollama serve' running?"
    except Exception as e:
        return f"Error generating explanation: {str(e)}"

# -------------------------------------------------
# VISUALIZATION FUNCTIONS
# -------------------------------------------------
def visualize_local_subgraph(user_id, rec_list, adj, sens, save_dir="RE_model_audit"):
    """
    Plots the 'Ego Network': the target user and their top recommendations.
    Nodes are colored by sensitive group to visually check for echo chambers.
    """
    if not os.path.exists(save_dir):
        os.makedirs(save_dir)
    G = nx.Graph()
    G.add_node(user_id, type='user', label="Target\nUser")
    for item in rec_list:
        G.add_node(item, type='item', label=f"Item\n{item}")
        G.add_edge(user_id, item)
    if hasattr(sens, 'cpu'): sens = sens.cpu().numpy()
    node_colors = []
    for node in G.nodes():
        if node == user_id:
            node_colors.append('#F4D03F') # Gold
        else:
            group = sens[node]
            node_colors.append('#3498DB' if group == 0 else '#E74C3C') # Blue / Red
    plt.figure(figsize=(9, 7), dpi=150)
    pos = nx.spring_layout(G, seed=42, k=0.5)
    nx.draw_networkx_nodes(G, pos, node_color=node_colors, node_size=1200, edgecolors='#2C3E50', linewidths=1.5)
    nx.draw_networkx_edges(G, pos, edge_color='#95A5A6', width=2, alpha=0.6)
    labels = nx.get_node_attributes(G, 'label')
    nx.draw_networkx_labels(G, pos, labels, font_size=8, font_weight='bold', font_color='#2C3E50')
    legend_elements = [
        Line2D([0], [0], marker='o', color='w', markerfacecolor='#F4D03F', markersize=15, label='Target User'),
        Line2D([0], [0], marker='o', color='w', markerfacecolor='#3498DB', markersize=15, label='Neighbors (Group A)'),
        Line2D([0], [0], marker='o', color='w', markerfacecolor='#E74C3C', markersize=15, label='Neighbors (Group B)')
    ]
    plt.legend(handles=legend_elements, loc='upper right', title="Sensitive Grouping", frameon=True)
    plt.title(f"Ego Network: User {user_id} & Top Recommendations\n(Checking for Homophily/Echo Chambers)", fontsize=12, fontweight='bold')
    plt.axis('off')
    save_path = os.path.join(save_dir, f"structural_expl_user_{user_id}.png")
    plt.savefig(save_path, bbox_inches='tight')
    plt.close()
    print(f" [Saved] Structural graph to {save_path}")

def plot_feature_importance(feat_dict, user_id, save_dir="RE_model_audit"):
    """
    Plots a horizontal bar chart showing the top positive and negative features.
    """
    if not os.path.exists(save_dir):
        os.makedirs(save_dir)
    if not feat_dict:
        return
    sorted_items = sorted(feat_dict.items(), key=lambda x: abs(x[1]), reverse=True)[:10]
    sorted_items = sorted_items[::-1]
    names = [k for k, v in sorted_items]
    values = [v for k, v in sorted_items]
    colors = ['#2ECC71' if v > 0 else '#E74C3C' for v in values]
    plt.figure(figsize=(10, 6), dpi=150)
    plt.barh(names, values, color=colors, edgecolor='black', alpha=0.8)
    plt.axvline(0, color='black', linewidth=1)
    plt.xlabel("Impact on Prediction Score\n(Positive = Increases Recommendation Likelihood)", fontsize=10, fontweight='bold')
    plt.ylabel("Feature Name", fontsize=10)
    plt.title(f"Why was User {user_id} selected?\nTop Feature Drivers", fontsize=12, fontweight='bold')
    plt.grid(axis='x', linestyle='--', alpha=0.5)
    save_path = os.path.join(save_dir, f"feature_attrib_user_{user_id}.png")
    plt.savefig(save_path, bbox_inches='tight')
    plt.close()
    print(f" [Saved] Feature plot to {save_path}")

def plot_bias_mitigation(before_metrics, after_metrics, save_dir="RE_model_audit"):
    """
    Plots 'Before vs After' metrics to show the trade-off between Accuracy and Fairness.
    Uses percentage labels to show improvement or degradation.
    """
    if not os.path.exists(save_dir):
        os.makedirs(save_dir)
    metrics_labels = ['Model Accuracy\n(Utility)', 'Fairness Gap\n(Stat. Parity)']
    b_acc = before_metrics.get('acc', 0)
    b_sp = before_metrics.get('parity', 0)
    vals_model = [b_acc, b_sp]
    a_acc = after_metrics.get('Accuracy', b_acc)
    a_sp = after_metrics.get('Exposure_Disparity', 0)
    vals_recs = [a_acc, a_sp]
    x = np.arange(len(metrics_labels))
    width = 0.35
    fig, ax = plt.subplots(figsize=(8, 6), dpi=150)
    rects1 = ax.bar(x - width/2, vals_model, width, label='Model Output (Raw)', color='#1ABC9C', edgecolor='black', alpha=0.9)
    rects2 = ax.bar(x + width/2, vals_recs, width, label='Final Recommendations (Deployed)', color='#9B59B6', edgecolor='black', alpha=0.9)
    ax.set_ylabel('Score (0.0 - 1.0)', fontweight='bold')
    ax.set_title('Fairness vs. Utility Trade-off', fontsize=14, fontweight='bold', pad=20)
    ax.set_xticks(x)
    ax.set_xticklabels(metrics_labels, fontsize=11, fontweight='bold')
    ax.set_ylim(0, 1.15)
    ax.grid(axis='y', linestyle='--', alpha=0.3)
    ax.legend(loc='upper center', bbox_to_anchor=(0.5, 1.15), ncol=2, frameon=False)
    ax.axhline(y=0.05, color='gray', linestyle=':', linewidth=2, alpha=0.7)
    ax.text(1.35, 0.055, 'Fairness Threshold (0.05)', fontsize=8, color='gray', ha='center')
    def calc_delta(start, end, metric_name):
        if start == 0: return ""
        pct = ((end - start) / start) * 100
        if "Accuracy" in metric_name:
            color = 'red' if pct < -1 else 'black'
            return f"{pct:.1f}%", color
        else:
            color = 'green' if pct < -10 else 'black'
            return f"▼ {abs(pct):.1f}%", color
    for rect in rects1:
        height = rect.get_height()
        ax.text(rect.get_x() + rect.get_width()/2, height + 0.01, f"{height:.3f}", ha='center', fontsize=10)
    for i, rect in enumerate(rects2):
        height = rect.get_height()
        ax.text(rect.get_x() + rect.get_width()/2, height + 0.01, f"{height:.3f}", ha='center', fontsize=10, fontweight='bold')
        delta_text, delta_color = calc_delta(vals_model[i], vals_recs[i], metrics_labels[i])
        if delta_text:
            ax.text(rect.get_x() + rect.get_width()/2, height + 0.05, delta_text, ha='center', fontsize=9, color=delta_color, fontweight='bold')
    plt.tight_layout()
    save_path = os.path.join(save_dir, "bias_mitigation_graph.png")
    plt.savefig(save_path)
    plt.close()
    print(f" [Saved] Focused mitigation graph to {save_path}")

def plot_opinion_polarization(scores, sens, save_dir="RE_model_audit"):
    """
    Plots the distribution of scores for each group to visualize polarization.
    If the curves overlap, polarization is low. If they are separate, it is high.
    """
    if not os.path.exists(save_dir):
        os.makedirs(save_dir)
    scores_np = np.array(scores)
    sens_np = np.array(sens)
    scores_g0 = scores_np[sens_np == 0]
    scores_g1 = scores_np[sens_np == 1]
    mean_0 = np.mean(scores_g0)
    mean_1 = np.mean(scores_g1)
    plt.figure(figsize=(10, 6), dpi=150)
    plt.hist(scores_g0, bins=30, alpha=0.6, label=f'Group 0 (Mean: {mean_0:.2f})', density=True, color='#5DADE2', edgecolor='none')
    plt.hist(scores_g1, bins=30, alpha=0.6, label=f'Group 1 (Mean: {mean_1:.2f})', density=True, color='#F5B041', edgecolor='none')
    plt.axvline(mean_0, color='#2874A6', linestyle='--', linewidth=2)
    plt.axvline(mean_1, color='#D35400', linestyle='--', linewidth=2)
    plt.title('Opinion Polarization Audit: Group Disparity', fontsize=14, fontweight='bold')
    plt.xlabel('Predicted Score (0=Low, 1=High)', fontsize=12)
    plt.ylabel('Density', fontsize=12)
    plt.legend(loc='upper right', frameon=True)
    plt.grid(axis='y', linestyle='--', alpha=0.3)
    if abs(mean_0 - mean_1) < 0.05:
        note = "Result: Minimal Polarization (Distributions Overlap)"
        color = "green"
    else:
        note = "Result: Significant Polarization Detected!"
        color = "red"
    plt.figtext(0.5, 0.01, note, ha="center", fontsize=10, fontweight='bold', color=color)
    save_path = os.path.join(save_dir, "opinion_polarization_graph.png")
    plt.savefig(save_path, bbox_inches='tight')
    plt.close()
    print(f" [Saved] Polarization graph to {save_path}")

def export_dashboard_json(model, adj, feats, prob_all, sens, labels, feature_names, user_id, save_dir="RE_model_audit"):
    """
    Exports all audit data to 5 separate JSON files.
    These files can be consumed by a frontend dashboard or used for offline analysis.
    """
    print(f" [Dashboard] Exporting JSON data for user {user_id}...")
    if not os.path.exists(save_dir):
        os.makedirs(save_dir)
    if hasattr(prob_all, 'detach'): probs = prob_all.detach().cpu().numpy()
    else: probs = np.array(prob_all)
    if hasattr(sens, 'cpu'): sens_np = sens.cpu().numpy()
    else: sens_np = np.array(sens)
    if hasattr(labels, 'cpu'): labels_np = labels.cpu().numpy()
    else: labels_np = np.array(labels)
    if hasattr(feats, 'detach'): feats_np = feats.detach().cpu().numpy()
    else: feats_np = np.array(feats)
    mean_g0 = float(np.mean(probs[sens_np == 0]))
    mean_g1 = float(np.mean(probs[sens_np == 1]))
    gap_after = abs(mean_g0 - mean_g1)
    raw_g0 = float(np.mean(labels_np[sens_np == 0]))
    raw_g1 = float(np.mean(labels_np[sens_np == 1]))
    gap_before = abs(raw_g0 - raw_g1)
    metrics_data = {
        "fairness_gap_before": gap_before,
        "fairness_gap_after": gap_after,
        "improvement_percent": ((gap_before - gap_after) / gap_before) * 100 if gap_before > 0 else 0,
        "mean_risk_group_0": mean_g0,
        "mean_risk_group_1": mean_g1
    }
    with open(os.path.join(save_dir, "metrics_global.json"), "w") as f:
        json.dump(metrics_data, f, indent=4)
    top_indices = []
    mask_values = []
    mask = find_mask_recursive(model)
    if mask is None:
        inner_model = find_model_recursive(model)
        if inner_model:
            mask = find_mask_recursive(inner_model)
    if mask is not None:
        if hasattr(mask, 'detach'): mask = mask.detach().cpu().numpy()
        else: mask = np.array(mask)
        sorted_idx = np.argsort(mask)[::-1]
        top_k = min(10, len(mask))
        top_indices = sorted_idx[:top_k]
        mask_values = mask[top_indices]
    else:
        print(" [Warning] Feature mask not found in model. Using feature variance as proxy.")
        variances = np.var(feats_np, axis=0)
        sorted_idx = np.argsort(variances)[::-1]
        top_k = min(10, len(feature_names))
        top_indices = sorted_idx[:top_k]
        mask_values = variances[top_indices]
        if np.max(mask_values) > 0:
            mask_values = mask_values / np.max(mask_values)
    features_data = []
    for i, idx in enumerate(top_indices):
        fname = feature_names[idx] if feature_names and idx < len(feature_names) else f"Feature_{idx}"
        features_data.append({"feature": fname, "attention_score": float(mask_values[i])})
    with open(os.path.join(save_dir, "data_features.json"), "w") as f:
        json.dump(features_data, f, indent=4)
    sample_size = 2000
    g0_probs = probs[sens_np == 0]
    g1_probs = probs[sens_np == 1]
    if len(g0_probs) > sample_size: g0_probs = np.random.choice(g0_probs, sample_size, replace=False)
    if len(g1_probs) > sample_size: g1_probs = np.random.choice(g1_probs, sample_size, replace=False)
    polarization_data = {
        "group_0_scores": g0_probs.tolist(),
        "group_1_scores": g1_probs.tolist()
    }
    with open(os.path.join(save_dir, "data_polarization.json"), "w") as f:
        json.dump(polarization_data, f, indent=4)
    if sp.issparse(adj):
        adj_coo = adj.tocoo()
        row = adj_coo.row
        col = adj_coo.col
    elif hasattr(adj, 'indices'):
        if not adj.is_coalesced():
            adj = adj.coalesce()
        indices = adj.indices().cpu().numpy()
        row = indices[0]
        col = indices[1]
    else:
        row, col = [], []
    if len(row) > 0:
        neighbors = col[row == user_id]
    else:
        neighbors = []
    nodes = [{"id": int(user_id), "group": int(sens_np[user_id]), "type": "target"}]
    links = []
    limit = 20
    for i, n in enumerate(neighbors[:limit]):
        if n == user_id: continue
        n_sens = int(sens_np[n])
        nodes.append({"id": int(n), "group": n_sens, "type": "neighbor"})
        links.append({"source": int(user_id), "target": int(n)})
    network_data = {"nodes": nodes, "links": links}
    with open(os.path.join(save_dir, "data_network.json"), "w") as f:
        json.dump(network_data, f, indent=4)
    recs = []
    global_means = np.mean(feats_np, axis=0)
    user_vals = feats_np[user_id]
    target_indices = top_indices if len(top_indices) > 0 else range(min(5, len(feature_names)))
    for i, idx in enumerate(target_indices):
        fname = feature_names[idx] if feature_names and idx < len(feature_names) else f"Feature_{idx}"
        u_val = float(user_vals[idx])
        avg_val = float(global_means[idx])
        impact_score = float(mask_values[i]) if len(mask_values) > i else 0.5
        impact_label = "High" if impact_score > 0.1 else "Medium"
        diff = u_val - avg_val
        action = ""
        if diff > 0:
            action = f"Reduce '{fname}' (Current: {u_val:.2f}, Avg: {avg_val:.2f})"
        else:
            action = f"Increase '{fname}' (Current: {u_val:.2f}, Avg: {avg_val:.2f})"
        recs.append({
            "id": i,
            "feature": fname,
            "user_value": u_val,
            "target_value": avg_val,
            "recommendation": action,
            "impact": impact_label,
            "weight": impact_score
        })
    with open(os.path.join(save_dir, "data_recommendations.json"), "w") as f:
        json.dump(recs, f, indent=4)
    print(" [Dashboard] 5 JSON files saved successfully.")

def run_audit_master(model, adj, feats, prob_all, sens, labels, dataset_name, before_metrics, feature_names_list=None):
    """
    The Main Entry Point for the Audit Layer.
    Orchestrates the entire explanation pipeline:
    1. Setup directories
    2. Data conversion (Tensor -> CPU Numpy)
    3. User Selection (Random sensitive user)
    4. Run GNNExplainer Pipeline
    5. Calculate Metrics
    6. Generate Reports & Graphs
    7. Export JSONs
    """
    print("\n--- Running Final Explanation & Audit Layer ---")
    # Lazy import to avoid circular dependency
    from metrics_recommendation import run_explained_pipeline, compute_recommendation_metrics
    
    # 1. Setup Directory
    audit_dir = "RE_model_audit"
    os.makedirs(audit_dir, exist_ok=True)
    print(f" [Info] Audit artifacts will be saved to: {audit_dir}/")

    # 2. Data Preparation: Convert tensors to CPU numpy arrays for safe plotting/metrics
    if isinstance(prob_all, list): scores_cpu = np.array(prob_all)
    elif hasattr(prob_all, 'detach'): scores_cpu = prob_all.detach().cpu().numpy()
    else: scores_cpu = prob_all
    
    sens_cpu = sens.cpu().numpy() if hasattr(sens, 'cpu') else sens
    lbls_cpu = labels.cpu().numpy() if hasattr(labels, 'cpu') else labels
    
    # Handle Adjacency Matrices (Sparse vs Dense vs Tensor)
    if sp.issparse(adj):
        adj_cpu = adj
        coo = adj.tocoo()
        row = torch.from_numpy(coo.row).to(torch.long)
        col = torch.from_numpy(coo.col).to(torch.long)
        adj_tensor = torch.stack([row, col], dim=0)
    elif torch.is_tensor(adj):
        if adj.dim() == 2 and adj.shape[0] == 2:
            adj_tensor = adj
            val = torch.ones(adj.shape[1])
            adj_cpu = sp.coo_matrix((val.numpy(), (adj[0].numpy(), adj[1].numpy())), shape=(feats.shape[0], feats.shape[0]))
        else:
            adj_tensor = adj
            if adj.is_sparse: adj_tensor = adj.coalesce().indices()
            adj_cpu = sp.coo_matrix(adj.to_dense().cpu().numpy())
    else:
        adj_cpu = adj
        adj_tensor = adj

    # 3. Model Hunting: Find the actual PyTorch model inside any wrappers
    pytorch_model = find_model_recursive(model)
    if pytorch_model is None:
        print(" [Warning] Could not find PyTorch model. Feature attribution will use Surrogate.")
        
    # 4. Features & Names: Ensure features are on the correct device (GPU/CPU)
    feats_tensor = feats if torch.is_tensor(feats) else torch.FloatTensor(feats)
    if torch.cuda.is_available() and pytorch_model:
        try:
            pytorch_model = pytorch_model.cuda()
            feats_tensor = feats_tensor.cuda()
            if isinstance(adj_tensor, torch.Tensor): adj_tensor = adj_tensor.cuda()
        except: pass

    # Use the feature names passed from train.py if available
    if feature_names_list is not None and len(feature_names_list) > 0:
        print(f" [Feature Map] Using {len(feature_names_list)} feature names passed from Training.")
        feat_map = feature_names_list
    else:
        print(" [Feature Map] No external list provided. Attempting to load from file...")
        feat_map = get_feature_names(dataset_name, feats_tensor.shape[1])

    # 5. User Selection: Randomly select a user from the sensitive group (e.g., Minority)
    local_rng = random.Random(time.time())
    sensitive_users = np.where(sens_cpu == 0)[0]
    if len(sensitive_users) > 0:
        target_user = local_rng.choice(sensitive_users)
    else:
        target_user = local_rng.randint(0, len(sens_cpu) - 1)
    print(f"\n[Audit Selection] Randomly selected User ID: {target_user}")

    # 6. Run Single-User Explanation Pipeline
    # This generates the specific explanation for the target user (GNNExplainer or Surrogate)
    audit_results = run_explained_pipeline(
        adj=adj_cpu, scores=scores_cpu, sens=sens_cpu, u_idx_to_explain=target_user,
        features=feats_tensor, model=pytorch_model, adj_tensor=adj_tensor,
        top_k=10, feature_names=feat_map, output_dir=audit_dir
    )

    # 7. Metrics & Reports
    print(" [Audit] Calculating global recommendation metrics for plot...")
    global_rec_metrics = compute_recommendation_metrics(
        adj=adj_cpu, scores=scores_cpu, sens=sens_cpu, y_true=lbls_cpu, top_k=10
    )
    y_pred_binary = (scores_cpu > 0.5).astype(int)
    real_acc = np.mean(y_pred_binary == lbls_cpu)
    real_sp = global_rec_metrics.get("Exposure_Disparity", 0.0)
    real_eo = global_rec_metrics.get("Bias_Amplification", 0.0)

    # Generate Reports via LLM
    user_context = {
        "user_id": target_user,
        "user_group": sens_cpu[target_user],
        "homophily": audit_results.get("metrics", {}).get("homophily_ratio", 0.0)
    }
    if "homophily_ratio" not in audit_results.get("metrics", {}):
        u_recs = audit_results.get("recs", [])
        if u_recs:
            counts = sum([1 for r in u_recs if sens_cpu[r] == sens_cpu[target_user]])
            user_context["homophily"] = counts / len(u_recs)

    print(" [LLM] Generating specialized reports (saving to disk)...")
    echo_report = get_human_readable_explanation(user_context, report_type="echo_chamber")
    with open(os.path.join(audit_dir, f"report_echo_chamber_user_{target_user}.txt"), "w") as f:
        f.write(echo_report)

    system_context = {"acc": float(real_acc), "sp": float(real_sp), "amp": float(real_eo)}
    comp_report = get_human_readable_explanation(system_context, report_type="compliance")
    with open(os.path.join(audit_dir, "report_regulatory_compliance.txt"), "w") as f:
        f.write(comp_report)

    # Generate Graphs
    after_plot_data = {'Accuracy': float(real_acc), 'Exposure_Disparity': float(real_sp), 'Bias_Amplification': float(real_eo)}
    def to_float(val): return val.item() if hasattr(val, 'item') else float(val)
    clean_before_metrics = {k: to_float(v) for k, v in before_metrics.items()}

    try:
        plot_bias_mitigation(clean_before_metrics, after_plot_data, save_dir=audit_dir)
    except Exception as e:
        print(f" Could not save bias mitigation graph: {e}")

    try:
        plot_opinion_polarization(scores_cpu, sens_cpu, save_dir=audit_dir)
    except Exception as e:
        print(f" Could not save polarization graph: {e}")

    # 10. NEW: Export JSON for Dashboard
    try:
        export_dashboard_json(
            model=model, # Pass wrapper 'model' so we can find masks
            adj=adj,
            feats=feats,
            prob_all=scores_cpu,
            sens=sens_cpu,
            labels=labels,
            feature_names=feat_map,
            user_id=target_user,
            save_dir=audit_dir
        )
    except Exception as e:
        print(f" Could not export dashboard JSON: {e}")

    print("Audit complete.")
