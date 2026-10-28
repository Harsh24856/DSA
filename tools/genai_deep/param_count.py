def llm_params(d, layers, vocab, ffn, heads, kv_heads, tied=False):
    head_dim = d // heads
    attn = 2 * d * d + 2 * d * kv_heads * head_dim     # Wq, Wo full size; Wk, Wv shrink with GQA
    mlp = 3 * d * ffn                                  # SwiGLU: gate, up, down
    emb = vocab * d * (1 if tied else 2)               # input table (+ separate output head)
    return layers * (attn + mlp) + emb

# A Llama-3-8B-shaped model
n = llm_params(d=4096, layers=32, vocab=128_256, ffn=14_336, heads=32, kv_heads=8)
print(f"{n / 1e9:.2f}B parameters")                    # 8.03B
print(f"training on 15T tokens ≈ 6·N·D = {6 * n * 15e12:.1e} FLOPs")
print(f"one generated token ≈ 2·N = {2 * n / 1e9:.0f} GFLOPs")
