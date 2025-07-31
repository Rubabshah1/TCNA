# import pandas as pd
# import numpy as np
# # # def cv_calculation(expr_matrix):
# # #     # expr_matrix = expr_matrix.values.astype(np.float32)
# # #     # cv_per_gene = expr_matrix.std(axis=1) / (expr_matrix.mean(axis=1) )
# # #     # cv_df = pd.DataFrame({'Gene': cv_per_gene.index, 'cv': cv_per_gene.values})
# # #     # cv_df.to_csv(f"/Users/rubabshah/Downloads/cancer-gene-noise-explorer-main 2/backend/data/metrics/{cancer}/cv_scores.csv", index = False)
# # #     mean_per_gene = np.mean(expr_matrix, axis=1)
# # #     std_per_gene = np.std(expr_matrix, axis=1, ddof=1)  # Sample standard deviation
# # #     # Compute CV (std / mean), avoiding division by zero
# # #     cv_per_gene = np.divide(std_per_gene, mean_per_gene, 
# # #                            out=np.zeros_like(std_per_gene), 
# # #                            where=mean_per_gene != 0)
# # #     return cv_per_gene
# # import pandas as pd
# # import numpy as np

# def cv_calculation(expr_matrix):
#     if expr_matrix.empty or expr_matrix.isna().all().all():
#         return pd.Series(0, index=expr_matrix.index)
#     mean_per_gene = np.mean(expr_matrix, axis=1)
#     std_per_gene = np.std(expr_matrix, axis=1, ddof=1)
#     cv_per_gene = np.divide(std_per_gene, mean_per_gene, 
#                            out=np.zeros_like(std_per_gene, dtype=float), 
#                            where=(mean_per_gene != 0) & (~np.isnan(mean_per_gene)) & (~np.isnan(std_per_gene)))
#     print(cv_per_gene)
#     return pd.Series(cv_per_gene*100, index=expr_matrix.index)
# #     if len(expr_matrix) == 0:
# #         return 0
# #     mean = np.mean(expr_matrix)
# #     std = np.std(expr_matrix)
# #     return ((std / mean) * 100) if mean != 0 else 0
# # import numpy as np
# # import pandas as pd

# # def cv_calculation(expr_matrix):
# #     # Assumes expr_matrix is a DataFrame: genes (rows) × samples (columns)
# #     mean_per_gene = np.mean(expr_matrix, axis=1)
# #     std_per_gene = np.std(expr_matrix, axis=1, ddof=1)
# #     cv_per_gene = np.divide(
# #         std_per_gene, 
# #         mean_per_gene, 
# #         out=np.zeros_like(std_per_gene), 
# #         where=mean_per_gene != 0
# #     )
# #     return pd.Series(cv_per_gene, index=expr_matrix.index)

# cv.py
import pandas as pd
import numpy as np

def cv_calculation(expr_matrix):
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
    # Calculate CV (std / mean), avoid division by zero
    cv_per_gene = std_per_gene / mean_per_gene.where(mean_per_gene != 0, np.finfo(float).eps)
    return pd.Series(cv_per_gene * 100, index=expr_matrix.index)