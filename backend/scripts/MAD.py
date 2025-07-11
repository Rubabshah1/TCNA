import pandas as pd
import numpy as np

def mad_calculation(expr_matrix):
    # Convert to float32 to reduce memory usage
    expr_array = expr_matrix.values.astype(np.float32)
    # Compute mean per gene (axis=1)
    mean_per_gene = np.mean(expr_array, axis=1)
    # Compute absolute deviations in one step
    abs_dev = np.abs(expr_array - mean_per_gene[:, np.newaxis])
    # Compute mean of absolute deviations
    mad_per_gene = np.mean(abs_dev, axis=1)
    # Return as pandas Series with original index
    return pd.Series(mad_per_gene, index=expr_matrix.index)