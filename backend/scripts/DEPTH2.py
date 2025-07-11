import pandas as pd
import numpy as np
from scipy.stats import zscore

#DEPTH2 score calculation
def depth2_calculation(expr_matrix):
    # z_scores = (expr_matrix - expr_matrix.mean()) / expr_matrix.std()
    z_scores = zscore(expr_matrix, axis=0)
    abs_z_scores = np.abs(z_scores)
    depth2_scores = abs_z_scores.std(axis=0)
    return pd.Series(depth2_scores, index=expr_matrix.columns)
