import tensorflow as tf

T = 1000
betas = tf.linspace(1e-4, 0.02, T)                    # noise schedule
alphas_bar = tf.math.cumprod(1 - betas)               # how much signal is left at step t

def diffusion_loss(model, x0):                        # x0: (B, H, W, C) clean images
    t = tf.random.uniform((tf.shape(x0)[0],), 0, T, dtype=tf.int32)
    eps = tf.random.normal(tf.shape(x0))
    ab = tf.reshape(tf.gather(alphas_bar, t), (-1, 1, 1, 1))
    xt = tf.sqrt(ab) * x0 + tf.sqrt(1 - ab) * eps     # jump straight to noisy step t
    return tf.reduce_mean(tf.square(model(xt, t) - eps))   # the network learns to predict the noise
