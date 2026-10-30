# Why PagedAttention fits more users: reserve KV memory in small blocks instead of one max-length slab.
requests = [300, 1200, 80, 2000, 450, 90, 700, 150]   # tokens each request actually ends up using
MAX_LEN, BLOCK = 4096, 16                              # tokens

contiguous = len(requests) * MAX_LEN                   # each request reserves room for the max length
paged = sum(-(-r // BLOCK) * BLOCK for r in requests)  # round each request up to whole 16-token blocks
used = sum(requests)

print(f"tokens actually used: {used}")
print(f"contiguous reservation: {contiguous} slots, {1 - used / contiguous:.0%} wasted")
print(f"paged blocks:           {paged} slots, {1 - used / paged:.1%} wasted")
print(f"same memory fits about {contiguous / paged:.0f}x more requests with paging")
assert paged < contiguous and (paged - used) < BLOCK * len(requests)
