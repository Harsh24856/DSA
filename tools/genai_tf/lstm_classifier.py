from tensorflow import keras
from tensorflow.keras import layers

class SeqClassifier(keras.Model):
    def __init__(self, vocab, d=128, h=256, n_cls=2):
        super().__init__()
        self.emb = layers.Embedding(vocab, d)
        self.lstm = layers.Bidirectional(layers.LSTM(h))   # final forward and backward states, joined: (B, 2h)
        self.head = layers.Dense(n_cls)

    def call(self, ids):                                    # ids: (B, T)
        return self.head(self.lstm(self.emb(ids)))
