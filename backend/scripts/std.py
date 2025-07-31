import pandas as pd
import numpy as np 

# def mean_std_calculation(expr_matrix):
#     # expr_matrix = expr_matrix.values.astype(np.float32)
#     mean_plus_std_per_gene = expr_matrix.std(axis=1) + expr_matrix.mean(axis=1)
#     # std_df = pd.DataFrame({'Gene': mean_plus_std_per_sample.index, 'std_dev': mean_plus_std_per_sample.values})
#     # std_df.to_csv(f"/Users/rubabshah/Downloads/cancer-gene-noise-explorer-main 2/backend/data/metrics/{cancer}/mean+std_dev_per_sample.csv", index = False)

#     return mean_plus_std_per_gene
def std_calculation(expr_matrix):
    # if expr_matrix.empty or expr_matrix.isna().all().all():
    if len(expr_matrix) == 0:
        return pd.Series(0, index=expr_matrix.index)
    # mean_per_gene = np.mean(expr_matrix, axis=1)
    # std_per_gene = np.std(expr_matrix, axis=1, ddof=1)
    std_per_gene = expr_matrix.std(axis=1)
    # mean_plus_std = np.where(np.isnan(mean_plus_std), 0, mean_plus_std)
    return pd.Series(std_per_gene, index=expr_matrix.index)

# def mean_std_calculation(values):
#     # Handle empty or invalid input
#     if len(values) == 0 or np.all(np.isnan(values)):
#         return 0.0
#     # Compute mean and standard deviation for the 1D array
#     mean = np.mean(values)
#     std = np.std(values, ddof=1)  # ddof=1 for sample standard deviation
#     mean_plus_std = mean + std
#     # Return 0 if result is NaN
#     return float(np.where(np.isnan(mean_plus_std), 0, mean_plus_std))