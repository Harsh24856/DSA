import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers

# ViT patch embedding: a conv with kernel = stride = patch size
patchify = layers.Conv2D(768, kernel_size=16, strides=16)          # 224×224 → 14×14 = 196 patches
img = tf.random.normal((8, 224, 224, 3))                            # channels last
tokens = tf.reshape(patchify(img), (8, -1, 768))                    # (8, 196, 768)
cls = tf.Variable(tf.zeros((1, 1, 768)))
pos = tf.Variable(tf.zeros((1, 197, 768)))
tokens = tf.concat([tf.tile(cls, [8, 1, 1]), tokens], axis=1) + pos  # ready for a transformer encoder

# CLIP contrastive loss for a batch of B image–text pairs
ce = keras.losses.SparseCategoricalCrossentropy(from_logits=True)

def clip_loss(img_emb, txt_emb, temperature=0.07):
    img, txt = tf.math.l2_normalize(img_emb, axis=-1), tf.math.l2_normalize(txt_emb, axis=-1)
    logits = img @ tf.transpose(txt) / temperature                  # (B, B) similarity matrix
    labels = tf.range(tf.shape(img)[0])                             # correct pairs sit on the diagonal
    return (ce(labels, logits) + ce(labels, tf.transpose(logits))) / 2
