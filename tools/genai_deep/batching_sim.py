# Static vs continuous batching for requests with very different output lengths.
lengths = [50, 400, 60, 380, 40, 420, 55, 30]        # tokens each request will generate
B = 4                                                 # sequences the GPU can decode together

def static_batching():
    t, finish = 0, []
    for i in range(0, len(lengths), B):               # a batch runs until its LONGEST member is done
        batch = lengths[i:i + B]
        finish += [t + max(batch)] * len(batch)       # short requests wait for the long one to finish
        t += max(batch)
    return t, sum(finish) / len(finish)

def continuous_batching():
    queue, running, t, finish = list(lengths), [], 0, []
    while queue or running:
        while queue and len(running) < B:             # refill free slots every step
            running.append(queue.pop(0))
        t += 1
        running = [r - 1 for r in running]
        finish += [t] * sum(1 for r in running if r == 0)
        running = [r for r in running if r > 0]
    return t, sum(finish) / len(finish)

s_total, s_avg = static_batching()
c_total, c_avg = continuous_batching()
print(f"static:     all done at step {s_total}, average finish {s_avg:.0f}")
print(f"continuous: all done at step {c_total}, average finish {c_avg:.0f}")
assert c_total <= s_total and c_avg < s_avg
