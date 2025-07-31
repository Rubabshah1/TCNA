import pandas as pd
import numpy as np 

def mean_calculation(expr_matrix):
    if len(expr_matrix) == 0:
        return pd.Series(0, index=expr_matrix.index)
    mean_per_gene = expr_matrix.mean(axis=1)
    print("MEAN: ", pd.Series(mean_per_gene, index=expr_matrix.index))
    return pd.Series(mean_per_gene, index=expr_matrix.index)