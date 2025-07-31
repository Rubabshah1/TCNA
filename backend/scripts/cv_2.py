import pandas as pd
import numpy as np

def cv2_calculation(expr_matrix):
    """
    Calculate Coefficient of Variation (CV) for each gene across samples.
    CV = (standard deviation / mean) * 100
    Returns a pd.Series with ensembl_id as index and CV values.
    """
    if expr_matrix.empty or expr_matrix.isna().all().all():
        return pd.Series(0, index=expr_matrix.index)
    mean_per_gene = np.mean(expr_matrix, axis=1)
    std_per_gene = np.std(expr_matrix, axis=1)
    # cv_per_gene = np.divide(std_per_gene, mean_per_gene, 
    #                         out=np.zeros_like(std_per_gene, dtype=float), 
    #                         where=(mean_per_gene != 0) & (~np.isnan(mean_per_gene)) & (~np.isnan(std_per_gene)))
    cv_per_gene = std_per_gene / mean_per_gene.where(mean_per_gene != 0, np.finfo(float).eps)
    cv2_per_gene = cv_per_gene**2
    return pd.Series(cv2_per_gene * 100, index=expr_matrix.index)