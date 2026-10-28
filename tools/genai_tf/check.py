"""Runs every TensorFlow lab in this folder and smoke-tests what it defines (shapes, finite losses).
The files are named after the PyTorch block they mirror. Needs tensorflow and scikit-learn:
    python tools/genai_tf/check.py"""
import pathlib, runpy, sys
import numpy as np
import tensorflow as tf
from tensorflow import keras

here = pathlib.Path(__file__).parent
ok = True

def run(name):
    return runpy.run_path(str(here / name), run_name="lab")

def check(name, fn):
    global ok
    try:
        fn(run(name)); print("ok  ", name)
    except Exception as e:  # report every failure, not just the first
        ok = False; print("FAIL", name, type(e).__name__, e)

def mlp(ns): assert float(ns["acc"]) > 0.9
def cnn(ns):
    assert ns["small_cnn"]()(tf.zeros((2, 28, 28, 1))).shape == (2, 10)
    assert ns["ResBlock"](8)(tf.zeros((2, 7, 7, 8)), training=True).shape == (2, 7, 7, 8)
def lstm(ns): assert ns["SeqClassifier"](100)(tf.zeros((2, 12), tf.int32)).shape == (2, 2)
def vit(ns):
    assert ns["tokens"].shape == (8, 197, 768)
    assert np.isfinite(float(ns["clip_loss"](tf.random.normal((4, 32)), tf.random.normal((4, 32)))))
def vae_gan(ns):
    enc, dec = keras.layers.Dense(8), keras.layers.Dense(10)
    assert np.isfinite(float(ns["vae_loss"](enc, dec, tf.random.normal((4, 10)))))
    G = keras.Sequential([keras.Input((100,)), keras.layers.Dense(10)])
    D = keras.Sequential([keras.Input((10,)), keras.layers.Dense(1)])
    d, g = ns["gan_step"](G, D, tf.random.normal((4, 10)), keras.optimizers.Adam(1e-3), keras.optimizers.Adam(1e-3))
    assert np.isfinite(d) and np.isfinite(g)
def ddpm(ns):
    model = lambda xt, t: xt * 0.5
    assert np.isfinite(float(ns["diffusion_loss"](model, tf.random.normal((2, 8, 8, 1)))))
def moe(ns): assert ns["MoE"](16)(tf.random.normal((5, 16))).shape == (5, 16)
def attn(ns):
    q = tf.random.normal((2, 3, 4, 8))
    y = ns["attention"](q, q, q)
    assert y.shape == (2, 3, 4, 8)
    # causal: the first position can only see itself, so its output equals v[0]
    assert np.allclose(y[:, :, 0].numpy(), q[:, :, 0].numpy(), atol=1e-5)
def block(ns):
    m = ns["TinyGPT"](50, d=64, n_layers=2)
    logits = m(tf.zeros((2, 7), tf.int32))
    assert logits.shape == (2, 7, 50)
    assert np.isfinite(float(ns["loss_fn"](tf.zeros((2, 7), tf.int32), logits)))
def gen(ns):
    m = lambda ids, training=False: tf.random.normal((tf.shape(ids)[0], tf.shape(ids)[1], 20))
    out = ns["generate"](m, tf.zeros((2, 3), tf.int32), max_new=5)
    assert out.shape == (2, 8) and int(tf.reduce_max(out)) < 20
    assert abs(ns["kv_cache_gb"](32, 8, 128, 8192) - 1.07) < 0.01
def lora(ns): assert ns["trainable"] == 131072
def dpo(ns):
    assert float(ns["dpo_loss"](tf.constant([2.]), tf.constant([0.]), tf.constant([0.]), tf.constant([0.]))) < np.log(2)
    a = ns["advantage"].numpy(); assert (a[[0, 3, 4]] > 0).all() and (a[[1, 2, 5, 6, 7]] < 0).all()

for name, fn in [("mlp_torch.py", mlp), ("cnn.py", cnn), ("lstm_classifier.py", lstm), ("vit_patches_and_clip_loss.py", vit),
                 ("vae_and_gan_core.py", vae_gan), ("ddpm_train_step.py", ddpm), ("moe_layer.py", moe),
                 ("attention_from_scratch.py", attn), ("modern_block.py", block), ("generate.py", gen),
                 ("lora_from_scratch.py", lora), ("dpo_and_grpo_core.py", dpo)]:
    check(name, fn)
sys.exit(0 if ok else 1)
