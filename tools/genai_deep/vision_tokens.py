# How many tokens does an image cost? A ViT cuts it into patches; each patch becomes one token.
def patch_tokens(width, height, patch=14):
    return (width // patch) * (height // patch)

def tiled_tokens(width, height, tile=448, patch=14):
    # many vision LLMs split large images into tiles plus one downscaled overview
    tiles = -(-width // tile) * -(-height // tile)              # ceiling division
    return (tiles + 1) * patch_tokens(tile, tile, patch)

print("224 x 224, patch 14:", patch_tokens(224, 224))           # 16 x 16 = 256 tokens
print("1344 x 896 screenshot, tiled:", tiled_tokens(1344, 896))  # 3 x 2 tiles + overview = 7 x 1024 = 7168
assert patch_tokens(224, 224) == 256 and tiled_tokens(1344, 896) == 7 * 1024
# Resize before sending: halving each side cuts the token count (and cost) about 4x.
