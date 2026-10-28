import tensorflow as tf
from tensorflow import keras
from sklearn.datasets import make_moons

X, y = make_moons(1000, noise=0.2, random_state=0)
X, y = X.astype("float32"), y.astype("float32")[:, None]

def make_model():
    return keras.Sequential([
        keras.Input((2,)),
        keras.layers.Dense(64, activation="gelu"),
        keras.layers.Dense(64, activation="gelu"),
        keras.layers.Dense(1),                               # raw logit, no sigmoid here
    ])

# 1) The Keras way: compile once, then fit
model = make_model()
model.compile(
    optimizer=keras.optimizers.AdamW(learning_rate=1e-2, weight_decay=1e-4),
    loss=keras.losses.BinaryCrossentropy(from_logits=True),   # sigmoid + BCE, numerically stable
    metrics=[keras.metrics.BinaryAccuracy(threshold=0.0)],    # logit > 0 means class 1
)
hist = model.fit(X, y, epochs=300, batch_size=len(X), verbose=0)   # full batch, like the PyTorch loop
print(f"fit:  loss={hist.history['loss'][-1]:.3f}  acc={hist.history['binary_accuracy'][-1]:.3f}")

# 2) The same loop by hand. GradientTape is TensorFlow's autograd: it records the forward pass
model = make_model()
opt = keras.optimizers.AdamW(learning_rate=1e-2, weight_decay=1e-4)
loss_fn = keras.losses.BinaryCrossentropy(from_logits=True)
for epoch in range(300):
    with tf.GradientTape() as tape:
        loss = loss_fn(y, model(X, training=True))
    grads = tape.gradient(loss, model.trainable_variables)        # chain rule, like loss.backward()
    opt.apply_gradients(zip(grads, model.trainable_variables))    # like opt.step(); no zero_grad needed

acc = tf.reduce_mean(tf.cast((model(X, training=False) > 0) == (y > 0.5), tf.float32))
print(f"tape: loss={float(loss):.3f}  acc={float(acc):.3f}")
