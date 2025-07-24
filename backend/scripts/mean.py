import pandas as pd
import numpy as np 

#     return mean_plus_std_per_gene
def mean_calculation(expr_matrix):
    # if expr_matrix.empty or expr_matrix.isna().all().all():
    if len(expr_matrix) == 0:
        return pd.Series(0, index=expr_matrix.index)
    mean_per_gene = expr_matrix.mean(axis=1)
    # mean_plus_std = np.where(np.isnan(mean_plus_std), 0, mean_plus_std)
    return pd.Series(mean_per_gene, index=expr_matrix.index)