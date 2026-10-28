import math

# one neuron, one example: L = (sigmoid(w·x + b) − y)²
w, b, x, y = 0.5, -0.2, 2.0, 1.0
z = w * x + b                    # 0.8
p = 1 / (1 + math.exp(-z))       # 0.690
L = (p - y) ** 2                 # 0.096

# backward: multiply local derivatives from the loss back to each parameter
dL_dp = 2 * (p - y)              # -0.620
dp_dz = p * (1 - p)              #  0.214   sigmoid' = p(1 − p), never above 0.25
dL_dz = dL_dp * dp_dz            # -0.133
dL_dw = dL_dz * x                # -0.265   because dz/dw = x
dL_db = dL_dz                    # -0.133   because dz/db = 1

# always check hand-written gradients with a finite difference
eps = 1e-6
L_plus = (1 / (1 + math.exp(-((w + eps) * x + b))) - y) ** 2
print(round(dL_dw, 4), round((L_plus - L) / eps, 4))   # -0.2653 -0.2653
