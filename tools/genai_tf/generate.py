import tensorflow as tf

def generate(model, ids, max_new=100, temperature=0.8, top_p=0.9):
    for _ in range(max_new):
        logits = model(ids, training=False)[:, -1, :] / temperature    # only the last position matters
        probs = tf.nn.softmax(logits, axis=-1)
        sorted_i = tf.argsort(probs, axis=-1, direction="DESCENDING")
        sorted_p = tf.gather(probs, sorted_i, batch_dims=1)
        keep = tf.cumsum(sorted_p, axis=-1) - sorted_p < top_p          # nucleus: smallest set reaching top_p
        sorted_p = tf.where(keep, sorted_p, 0.0)
        choice = tf.random.categorical(tf.math.log(sorted_p), 1)        # log(0) = -inf, so dropped tokens never win
        ids = tf.concat([ids, tf.gather(sorted_i, choice, batch_dims=1)], axis=1)
    return ids

def kv_cache_gb(layers, kv_heads, head_dim, seq_len, batch=1, bytes_per=2):
    return 2 * layers * kv_heads * head_dim * seq_len * batch * bytes_per / 1e9

# An 8B Llama-3-style model: 32 layers, 8 KV heads (GQA), head_dim 128, 8k context, bf16
print(kv_cache_gb(32, 8, 128, 8192))    # ≈ 1.07 GB per sequence. 32 users ≈ 34 GB just for cache.
