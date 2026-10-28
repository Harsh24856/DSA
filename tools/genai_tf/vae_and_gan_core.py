import tensorflow as tf
from tensorflow import keras

# ---- VAE loss ----
def vae_loss(encoder, decoder, x):
    mu, logvar = tf.split(encoder(x), 2, axis=-1)
    z = mu + tf.exp(0.5 * logvar) * tf.random.normal(tf.shape(mu))   # reparameterization trick
    x_hat = decoder(z)
    recon = tf.reduce_sum(tf.square(x_hat - x))
    kl = -0.5 * tf.reduce_sum(1 + logvar - mu ** 2 - tf.exp(logvar))
    return recon + kl

# ---- one GAN training step ----
bce = keras.losses.BinaryCrossentropy(from_logits=True)

def gan_step(G, D, real, opt_g, opt_d, z_dim=100):
    z = tf.random.normal((tf.shape(real)[0], z_dim))
    with tf.GradientTape() as tape:              # D: real → 1, fake → 0
        real_logits, fake_logits = D(real, training=True), D(G(z, training=True), training=True)
        d_loss = bce(tf.ones_like(real_logits), real_logits) + bce(tf.zeros_like(fake_logits), fake_logits)
    # only D's weights get gradients here, so no .detach() is needed
    opt_d.apply_gradients(zip(tape.gradient(d_loss, D.trainable_variables), D.trainable_variables))

    with tf.GradientTape() as tape:              # G: make D say "real"
        fake_logits = D(G(z, training=True), training=True)
        g_loss = bce(tf.ones_like(fake_logits), fake_logits)
    opt_g.apply_gradients(zip(tape.gradient(g_loss, G.trainable_variables), G.trainable_variables))
    return float(d_loss), float(g_loss)
