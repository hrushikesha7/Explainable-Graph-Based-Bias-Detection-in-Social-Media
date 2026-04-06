import numpy as np
from sklearn.metrics import roc_auc_score, accuracy_score, f1_score

# -----------------------------
# Fairness Metrics
# -----------------------------

def statistical_parity(y_hat: np.ndarray, sens: np.ndarray) -> float:
    sp0 = y_hat[sens == 0].mean() if np.any(sens == 0) else np.nan
    sp1 = y_hat[sens == 1].mean() if np.any(sens == 1) else np.nan
    return abs(sp0 - sp1)


def equality_of_opportunity(y_true: np.ndarray, y_hat: np.ndarray, sens: np.ndarray) -> float:
    tpr0_idx = (y_true == 1) & (sens == 0)
    tpr1_idx = (y_true == 1) & (sens == 1)
    tpr0 = y_hat[tpr0_idx].mean() if np.any(tpr0_idx) else np.nan
    tpr1 = y_hat[tpr1_idx].mean() if np.any(tpr1_idx) else np.nan
    return abs(tpr0 - tpr1)


def false_positive_rate_gap(y_true: np.ndarray, y_hat: np.ndarray, sens: np.ndarray) -> float:
    fpr0_idx = (y_true == 0) & (sens == 0)
    fpr1_idx = (y_true == 0) & (sens == 1)
    fpr0 = y_hat[fpr0_idx].mean() if np.any(fpr0_idx) else np.nan
    fpr1 = y_hat[fpr1_idx].mean() if np.any(fpr1_idx) else np.nan
    return abs(fpr0 - fpr1)


def auc_parity(y_true: np.ndarray, y_prob: np.ndarray, sens: np.ndarray):
    def safe_auc(y_t, y_p):
        try:
            return roc_auc_score(y_t, y_p)
        except ValueError:
            return np.nan
    auc0 = safe_auc(y_true[sens == 0], y_prob[sens == 0])
    auc1 = safe_auc(y_true[sens == 1], y_prob[sens == 1])
    return abs(auc0 - auc1), auc0, auc1


def decision_polarization(y_hat: np.ndarray, sens: np.ndarray) -> float:
    mean0 = y_hat[sens == 0].mean() if np.any(sens == 0) else np.nan
    mean1 = y_hat[sens == 1].mean() if np.any(sens == 1) else np.nan
    return abs(mean0 - mean1)


# -----------------------------
# Group-wise Performance Metrics
# -----------------------------

def group_performance(y_true: np.ndarray, y_hat: np.ndarray, y_prob: np.ndarray, sens: np.ndarray) -> dict:
    out = {}
    for g in [0, 1]:
        idx = sens == g

        if np.any(idx):
            out[f'acc_sens{g}'] = accuracy_score(y_true[idx], y_hat[idx])

            # ✅ FIXED: macro-F1 (multiclass-safe)
            out[f'f1_sens{g}'] = f1_score(
                y_true[idx],
                y_hat[idx],
                average="macro",
                zero_division=0
            )

            try:
                out[f'auc_sens{g}'] = roc_auc_score(y_true[idx], y_prob[idx])
            except ValueError:
                out[f'auc_sens{g}'] = np.nan
        else:
            out[f'acc_sens{g}'] = np.nan
            out[f'f1_sens{g}']  = np.nan
            out[f'auc_sens{g}'] = np.nan

    return out



# -----------------------------
# Utility: Compute All Metrics
# -----------------------------

def compute_post_exposure_metrics(y_true, y_hat, y_prob, sens):
    """
    Compute post-exposure metrics that are NOT redundant with standard metrics.
    
    Standard metrics (from model.predict()) already include:
    - SP, EO (fairness)
    - ACC, AUCROC, F1 (overall and per-group)
    
    This function only returns NEW metrics not computed elsewhere:
    - fpr_gap: False Positive Rate gap
    - auc_gap: AUC parity gap
    - decision_polarization: Gap in average predictions between groups
    """
    metrics = {}
    
    # New metrics not computed in standard metrics
    metrics['fpr_gap'] = false_positive_rate_gap(y_true, y_hat, sens)
    
    auc_gap, auc_s0, auc_s1 = auc_parity(y_true, y_prob, sens)
    metrics['auc_gap'] = auc_gap
    
    metrics['decision_polarization'] = decision_polarization(y_hat, sens)
    
    return metrics
