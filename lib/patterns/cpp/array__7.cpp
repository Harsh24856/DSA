// first value in [lo, hi] where ok is true; ok must read false ... false true ... true over the range
template <class F> long long firstTrue(long long lo, long long hi, F ok) {
    while (lo < hi) {
        long long mid = lo + (hi - lo) / 2;      // rounds down, so lo = mid + 1 always makes progress
        if (ok(mid)) hi = mid;
        else lo = mid + 1;
    }
    return lo;
}

// Koko: the smallest speed that finishes every pile within h hours
int minEatingSpeed(const vector<int>& piles, int h) {
    return (int)firstTrue(1, *max_element(piles.begin(), piles.end()), [&](long long v) {
        long long hours = 0;
        for (int p : piles) hours += (p + v - 1) / v;   // ceil(p / v)
        return hours <= h;
    });
}
// @test
    H::check(minEatingSpeed({3, 6, 7, 11}, 8), 4, "koko 1");
    H::check(minEatingSpeed({30, 11, 23, 4, 20}, 5), 30, "koko 2");
    H::check(minEatingSpeed({30, 11, 23, 4, 20}, 6), 23, "koko 3");
    H::check(firstTrue(0, 100, [](long long x) { return x * x >= 50; }), 8LL, "first square >= 50");
    vector<int> s{1, 3, 5, 7};
    H::check(firstTrue(0, 4, [&](long long i) { return s[i] >= 5; }), 2LL, "lower bound");
    H::check(firstTrue(0, 4, [&](long long i) { return s[i] >= 9; }), 4LL, "none: returns hi");
