import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers

class LoRADense(layers.Layer):
    def __init__(self, base: layers.Dense, r=16, alpha=32, **kw):
        super().__init__(**kw)
        self.base, self.r, self.scale = base, r, alpha / r
        self.base.trainable = False                          # freeze the original layer

    def build(self, shape):
        self.A = self.add_weight(shape=(shape[-1], self.r), initializer=keras.initializers.RandomNormal(stddev=0.01))
        self.B = self.add_weight(shape=(self.r, self.base.units), initializer="zeros")   # zero, so we start equal to base

    def call(self, x):
        return self.base(x) + (x @ self.A @ self.B) * self.scale

layer = LoRADense(layers.Dense(4096))
layer(tf.zeros((1, 4096)))                                   # build the weights
trainable = sum(int(tf.size(w)) for w in layer.trainable_weights)
print(trainable, "trainable vs", 4096 * 4096, "frozen")      # 131,072 vs 16,777,216 (0.8%)
