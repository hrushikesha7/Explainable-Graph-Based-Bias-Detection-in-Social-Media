import numpy as np
import scipy.sparse as sp
import networkx as nx

def _edges_from_adj(adj):
    """
    adj can be scipy sparse or torch dense/sparse-like converted earlier.
    Returns undirected unique edge list (u,v) with u < v.
    """
    if not sp.issparse(adj):
        adj = sp.coo_matrix(adj)
    adj = adj.tocoo()
    rows, cols = adj.row, adj.col
    mask = rows < cols
    return rows[mask], cols[mask]

def echo_polar_metrics(adj, sens, labels=None, yhat=None):
    """
    sens: array-like of {0,1} (or discrete groups)
    labels: ground-truth label (0/1) optional
    yhat: predicted label (0/1) optional
    """
    sens = np.asarray(sens).astype(int)

    u, v = _edges_from_adj(adj)

    same_s = (sens[u] == sens[v])
    Ein = same_s.sum()
    Eout = (~same_s).sum()
    Etot = Ein + Eout

    # E-I index
    ei = (Eout - Ein) / Etot if Etot > 0 else np.nan
    p_intra = Ein / Etot if Etot > 0 else np.nan

    # Build graph for assortativity
    G = nx.Graph()
    G.add_edges_from(zip(u.tolist(), v.tolist()))

    # Sensitive assortativity (echo-chamber)
    sens_attr = {i: int(sens[i]) for i in range(len(sens))}
    nx.set_node_attributes(G, sens_attr, "sens")
    assort_sens = nx.attribute_assortativity_coefficient(G, "sens")

    out = {
        "edges_total": int(Etot),
        "intra_edges": int(Ein),
        "inter_edges": int(Eout),
        "p_intra_sens": float(p_intra),
        "ei_index_sens": float(ei),
        "assort_sens": float(assort_sens),
    }

    # Polarization proxies (label/prediction segregation)
    def add_assort(name, arr):
        arr = np.asarray(arr).astype(int)
        attr = {i: int(arr[i]) for i in range(len(arr))}
        nx.set_node_attributes(G, attr, name)
        out[f"assort_{name}"] = float(nx.attribute_assortativity_coefficient(G, name))

        # also report p_intra for that attribute
        same = (arr[u] == arr[v])
        out[f"p_intra_{name}"] = float(same.mean()) if len(u) else np.nan

    if labels is not None:
        add_assort("label", labels)

    if yhat is not None:
        add_assort("yhat", yhat)

    return out
