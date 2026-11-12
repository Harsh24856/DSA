// quickselect: partition around a random pivot, then keep only the side that holds index n - k
// (in production C++, nth_element does this for you)
int kthLargest(vector<int> a, int k) {
    static unsigned seed = 2463534242u;                 // xorshift: a cheap random pivot
    auto rnd = [](int lo, int hi) {
        seed ^= seed << 13; seed ^= seed >> 17; seed ^= seed << 5;
        return lo + (int)(seed % (unsigned)(hi - lo + 1));
    };
    int want = (int)a.size() - k, lo = 0, hi = (int)a.size() - 1;
    while (true) {
        swap(a[rnd(lo, hi)], a[hi]);
        int i = lo;
        for (int j = lo; j < hi; j++)
            if (a[j] < a[hi]) swap(a[i++], a[j]);
        swap(a[i], a[hi]);                              // the pivot lands at its sorted index i
        if (i == want) return a[i];
        if (i < want) lo = i + 1;
        else hi = i - 1;
    }
}
// @test
    H::check(kthLargest({3, 2, 1, 5, 6, 4}, 2), 5, "k = 2");
    H::check(kthLargest({3, 2, 3, 1, 2, 4, 5, 5, 6}, 4), 4, "with duplicates");
    H::check(kthLargest({1}, 1), 1, "one element");
    H::check(kthLargest({2, 2, 2, 2}, 3), 2, "all equal");
    for (int k = 1; k <= 7; k++) H::check(kthLargest({7, 2, 9, 4, 1, 8, 3}, k), H::sorted(vector<int>{7, 2, 9, 4, 1, 8, 3})[7 - k], "every k");
