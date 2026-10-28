import tensorflow as tf

def attention(q, k, v, causal=True):              # q, k, v: (B, H, T, D)
    d = tf.cast(tf.shape(q)[-1], q.dtype)
    scores = tf.matmul(q, k, transpose_b=True) / tf.sqrt(d)    # (B, H, T, T)
    if causal:
        T = tf.shape(q)[-2]
        future = tf.linalg.band_part(tf.ones((T, T)), 0, -1) > tf.linalg.band_part(tf.ones((T, T)), 0, 0)  # above the diagonal
        scores = tf.where(future, float("-inf"), scores)
    weights = tf.nn.softmax(scores, axis=-1)                   # each row sums to 1
    return weights @ v                                         # (B, H, T, D)

# Keras ships the whole thing (projections + heads) as one layer:
# y = tf.keras.layers.MultiHeadAttention(num_heads=8, key_dim=64)(x, x, use_causal_mask=True)
