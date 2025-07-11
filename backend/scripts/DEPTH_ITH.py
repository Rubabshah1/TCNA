import pandas as pd
# 5. DEPTH-ith score calculation
def depth_ith_calculation(expr_matrix):
    score_matrix = (expr_matrix - expr_matrix.mean(axis=0)) ** 2
    heterogeneity_score = score_matrix.std(axis=0)

    return heterogeneity_score