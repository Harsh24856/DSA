import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers

class MoE(layers.Layer):
    def __init__(self, d, n_experts=8, k=2, **kw):
        super().__init__(**kw)
        self.k = k
        self.router = layers.Dense(n_experts, use_bias=False)
        self.experts = [keras.Sequential([layers.Dense(4 * d, activation="silu"), layers.Dense(d)]) for _ in range(n_experts)]

    def call(self, x):                                       # x: (tokens, d)
        weights, idx = tf.math.top_k(self.router(x), k=self.k)   # pick k experts per token
        weights = tf.nn.softmax(weights, axis=-1)
        out = tf.zeros_like(x)
        # For readability every expert runs on every token and a 0/1 mask keeps the chosen ones.
        # Real kernels send each token only to its k experts, which is where MoE saves compute.
        for slot in range(self.k):
            for e, expert in enumerate(self.experts):
                mask = tf.cast(idx[:, slot] == e, x.dtype)[:, None]
                out += mask * weights[:, slot, None] * expert(x)
        return out
