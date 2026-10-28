import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers

def small_cnn(n_cls=10):
    return keras.Sequential([
        keras.Input((28, 28, 1)),     # channels last: (H, W, C). PyTorch uses (C, H, W)
        layers.Conv2D(32, 3, padding="same"), layers.BatchNormalization(), layers.ReLU(), layers.MaxPool2D(),  # 28 → 14
        layers.Conv2D(64, 3, padding="same"), layers.BatchNormalization(), layers.ReLU(), layers.MaxPool2D(),  # 14 → 7
        layers.Flatten(),
        layers.Dense(n_cls),
    ])

class ResBlock(layers.Layer):
    def __init__(self, c, **kw):
        super().__init__(**kw)
        self.c1, self.b1 = layers.Conv2D(c, 3, padding="same"), layers.BatchNormalization()
        self.c2, self.b2 = layers.Conv2D(c, 3, padding="same"), layers.BatchNormalization()

    def call(self, x, training=False):          # `training` switches BatchNorm between batch and running stats
        out = tf.nn.relu(self.b1(self.c1(x), training=training))
        return tf.nn.relu(x + self.b2(self.c2(out), training=training))   # the skip connection
