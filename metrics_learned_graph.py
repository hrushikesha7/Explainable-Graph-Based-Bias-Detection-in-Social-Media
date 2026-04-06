import numpy as np
import scipy.sparse as sp
from sklearn.neighbors import NearestNeighbors

def knn_graph(emb, k=20, metric="cosine"):
    emb = np.asarray(emb, dtype=float)
    N = emb.shape[0]

    nn = NearestNeighbors(n_neighbors=k + 1, metric=metric)
    nn.fit(emb)
    _, idx = nn.kneighbors(emb)

    rows = np.repeat(np.arange(N), k)
    cols = idx[:, 1:].reshape(-1)  # skip self
    data = np.ones_like(cols, dtype=np.float32)

    A = sp.coo_matrix((data, (rows, cols)), shape=(N, N))
    A = A.maximum(A.T)  # undirected
    A.setdiag(0)
    A.eliminate_zeros()
    return A
