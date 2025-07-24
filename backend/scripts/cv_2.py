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
    cv_per_gene = expr_matrix.std(axis=1) / expr_matrix.mean(axis=1)
    cv2_per_gene = cv_per_gene**2
    # print(f"[DEBUG] CV calculation - mean: {mean_per_gene.head().to_dict()}")
    # print(f"[DEBUG] CV calculation - std: {std_per_gene.head().to_dict()}")
    # print(f"[DEBUG] CV calculation - cv: {cv_per_gene.head().to_dict()}")
    return pd.Series(cv2_per_gene * 100, index=expr_matrix.index)
