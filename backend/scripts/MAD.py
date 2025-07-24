import pandas as pd
import numpy as np

def mad_calculation(expr_matrix):
    # if expr_matrix.empty or expr_matrix.isna().all().all():
    if len(expr_matrix) == 0:
        return pd.Series(0, index=expr_matrix.index)
    expr_array = expr_matrix.values.astype(np.float32)
    mean_per_gene = np.mean(expr_array, axis=1)
    abs_dev = np.abs(expr_array - mean_per_gene[:, np.newaxis])
    mad_per_gene = np.mean(abs_dev, axis=1)
    mad_per_gene = np.where(np.isnan(mad_per_gene), 0, mad_per_gene)
    return pd.Series(mad_per_gene, index=expr_matrix.index)
