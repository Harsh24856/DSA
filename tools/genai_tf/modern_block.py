import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers

def rope(x, base=10000.0):
    # x: (B, H, T, D). Rotate each pair of dims by an angle that grows with position.
    T, D = tf.shape(x)[2], x.shape[-1]
    inv_freq = 1.0 / (base ** (tf.range(0, D, 2, dtype=tf.float32) / D))
    ang = tf.cast(tf.range(T), tf.float32)[:, None] * inv_freq[None, :]     # (T, D/2)
    cos, sin = tf.cos(ang), tf.sin(ang)
    x1, x2 = x[..., 0::2], x[..., 1::2]
    return tf.reshape(tf.stack([x1 * cos - x2 * sin, x1 * sin + x2 * cos], axis=-1), tf.shape(x))

def attention(q, k, v):                            # causal, as in attention_from_scratch.py
    scores = tf.matmul(q, k, transpose_b=True) / tf.sqrt(tf.cast(tf.shape(q)[-1], q.dtype))
    T = tf.shape(q)[-2]
    future = tf.linalg.band_part(tf.ones((T, T)), 0, -1) > tf.linalg.band_part(tf.ones((T, T)), 0, 0)
    return tf.nn.softmax(tf.where(future, float("-inf"), scores), axis=-1) @ v

class RMSNorm(layers.Layer):
    def __init__(self, eps=1e-6, **kw):
        super().__init__(**kw)
        self.eps = eps
    def build(self, shape):
        self.w = self.add_weight(shape=(shape[-1],), initializer="ones")
    def call(self, x):
        return self.w * x * tf.math.rsqrt(tf.reduce_mean(tf.square(x), axis=-1, keepdims=True) + self.eps)

class GQAttention(layers.Layer):
    def __init__(self, d_model=512, n_heads=8, n_kv_heads=2, **kw):
        super().__init__(**kw)
        self.h, self.kv, self.hd = n_heads, n_kv_heads, d_model // n_heads
        self.q = layers.Dense(n_heads * self.hd, use_bias=False)
        self.k = layers.Dense(n_kv_heads * self.hd, use_bias=False)
        self.v = layers.Dense(n_kv_heads * self.hd, use_bias=False)
        self.o = layers.Dense(d_model, use_bias=False)

    def split(self, t, n):                           # (B, T, n·hd) → (B, n, T, hd)
        B, T = tf.shape(t)[0], tf.shape(t)[1]
        return tf.transpose(tf.reshape(t, [B, T, n, self.hd]), (0, 2, 1, 3))

    def call(self, x):
        B, T = tf.shape(x)[0], tf.shape(x)[1]
        q, k, v = self.split(self.q(x), self.h), self.split(self.k(x), self.kv), self.split(self.v(x), self.kv)
        q, k = rope(q), rope(k)
        rep = self.h // self.kv                      # each K/V head serves `rep` query heads
        k, v = tf.repeat(k, rep, axis=1), tf.repeat(v, rep, axis=1)
        y = attention(q, k, v)
        return self.o(tf.reshape(tf.transpose(y, (0, 2, 1, 3)), [B, T, self.h * self.hd]))

class SwiGLU(layers.Layer):
    def __init__(self, d, hidden, **kw):
        super().__init__(**kw)
        self.gate = layers.Dense(hidden, use_bias=False)
        self.up = layers.Dense(hidden, use_bias=False)
        self.down = layers.Dense(d, use_bias=False)
    def call(self, x):
        return self.down(tf.nn.silu(self.gate(x)) * self.up(x))

class Block(layers.Layer):
    def __init__(self, d=512, **kw):
        super().__init__(**kw)
        self.n1, self.attn = RMSNorm(), GQAttention(d)
        self.n2, self.ffn = RMSNorm(), SwiGLU(d, 4 * d)
    def call(self, x):
        x = x + self.attn(self.n1(x))
        return x + self.ffn(self.n2(x))

class TinyGPT(keras.Model):
    def __init__(self, vocab, d=512, n_layers=6):
        super().__init__()
        self.emb = layers.Embedding(vocab, d)
        self.blocks = [Block(d) for _ in range(n_layers)]
        self.norm = RMSNorm()

    def call(self, ids):
        x = self.emb(ids)
        for b in self.blocks:
            x = b(x)
        return tf.matmul(self.norm(x), self.emb.embeddings, transpose_b=True)   # weight tying: reuse the embedding table

loss_fn = keras.losses.SparseCategoricalCrossentropy(from_logits=True)       # loss = loss_fn(targets, model(ids))
