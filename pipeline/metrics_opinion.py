import numpy as np
from scipy.spatial.distance import jensenshannon

def opinion_polarization(prob, sens=None, bins=20):
    prob = np.asarray(prob, dtype=float)
    prob = np.clip(prob, 1e-6, 1 - 1e-6)

    out = {}
    out["prob_mean"] = float(prob.mean())
    out["prob_var"] = float(prob.var())
    out["extreme_frac_0.1"] = float(((prob < 0.1) | (prob > 0.9)).mean())
    out["extreme_frac_0.2"] = float(((prob < 0.2) | (prob > 0.8)).mean())

    if sens is not None:
        sens = np.asarray(sens).astype(int)
        p0 = prob[sens == 0]
        p1 = prob[sens == 1]
        out["group_mean_gap"] = float(abs(p0.mean() - p1.mean()))

        h0, _ = np.histogram(p0, bins=bins, range=(0, 1), density=True)
        h1, _ = np.histogram(p1, bins=bins, range=(0, 1), density=True)
        h0 = h0 / (h0.sum() + 1e-12)
        h1 = h1 / (h1.sum() + 1e-12)

        out["js_div_prob_by_sens"] = float(jensenshannon(h0, h1, base=2.0) ** 2)

    return out
