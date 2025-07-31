import pandas as pd
import numpy as np 


def std_calculation(expr_matrix):
    # if expr_matrix.empty or expr_matrix.isna().all().all():
    if len(expr_matrix) == 0:
        return pd.Series(0, index=expr_matrix.index)
    # mean_per_gene = np.mean(expr_matrix, axis=1)
    # std_per_gene = np.std(expr_matrix, axis=1, ddof=1)
    std_per_gene = expr_matrix.std(axis=1)
    # mean_plus_std = np.where(np.isnan(mean_plus_std), 0, mean_plus_std)
    return pd.Series(std_per_gene, index=expr_matrix.index)
