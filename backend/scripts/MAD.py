import pandas as pd
import numpy as np

# def mad_calculation(expr_matrix):
#     # Convert to float32 to reduce memory usage
#     expr_array = expr_matrix.values.astype(np.float32)
#     # Compute mean per gene (axis=1)
#     mean_per_gene = np.mean(expr_array, axis=1)
#     # Compute absolute deviations in one step
#     abs_dev = np.abs(expr_array - mean_per_gene[:, np.newaxis])
#     # Compute mean of absolute deviations
#     mad_per_gene = np.mean(abs_dev, axis=1)
#     # Return as pandas Series with original index
#     return pd.Series(mad_per_gene, index=expr_matrix.index)

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
# def mad_calculation(values):
#     # Handle empty or invalid input
#     if len(values) == 0 or np.all(np.isnan(values)):
#         return 0.0
#     # Compute mean and absolute deviations
#     mean = np.mean(values)
#     abs_dev = np.abs(values - mean)
#     mad = np.mean(abs_dev)
#     # Return 0 if result is NaN
#     return float(np.where(np.isnan(mad), 0, mad))