# Training memory for a 7B model (weights + gradients + Adam states; activations ignored, they add more).
P = 7e9
GB = 1e9

def full_finetune():          # bf16 weights and grads, fp32 Adam moments (m, v) and an fp32 master copy
    return (2 * P + 2 * P + 8 * P + 4 * P) / GB

def lora(rank=16, layers=32, d=4096, targets=4, weight_bytes=2):
    trainable = layers * targets * 2 * d * rank           # A and B for q, k, v, o in each layer
    frozen = P * weight_bytes                              # bf16 (2 bytes) or 4-bit (0.5 bytes) base model
    return (frozen + trainable * (2 + 2 + 8 + 4)) / GB, trainable

full = full_finetune()
lo, n = lora()
qlo, _ = lora(weight_bytes=0.5)
print(f"full fine-tune  ~{full:.0f} GB")       # ~112 GB: several large GPUs
print(f"LoRA (bf16)     ~{lo:.1f} GB  trainable params {n / 1e6:.1f}M")
print(f"QLoRA (4-bit)   ~{qlo:.1f} GB")       # fits a single 24 GB GPU, with room for activations
assert qlo < 24 < full and n < 0.01 * P
