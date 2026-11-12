// Fenwick (binary indexed) tree: t[i] stores the sum of a over (i - lowbit(i), i], 1-based
struct Fenwick {
    vector<long long> t;
    explicit Fenwick(int n) : t(n + 1, 0) {}
    void add(int i, long long v) {                       // a[i] += v, i is 0-based
        for (i++; i < (int)t.size(); i += i & -i) t[i] += v;
    }
    long long prefix(int i) const {                      // sum of a[0..i-1]
        long long s = 0;
        for (; i > 0; i -= i & -i) s += t[i];
        return s;
    }
    long long rangeSum(int l, int r) const { return prefix(r + 1) - prefix(l); }   // a[l..r]
};
// @test
    vector<int> a{5, 2, 9, -3, 5, 20, 10, -7};
    Fenwick f(a.size());
    for (int i = 0; i < (int)a.size(); i++) f.add(i, a[i]);
    H::check(f.rangeSum(0, 7), 41LL, "whole array");
    H::check(f.rangeSum(2, 4), 11LL, "middle");
    H::check(f.prefix(0), 0LL, "empty prefix");
    f.add(3, 10); a[3] += 10;
    H::check(f.rangeSum(2, 4), 21LL, "after an update");
    int bad = 0;
    for (int l = 0; l < 8; l++)
        for (int r = l; r < 8; r++)
            if (f.rangeSum(l, r) != accumulate(a.begin() + l, a.begin() + r + 1, 0LL)) bad++;
    H::check(bad, 0, "every range matches a brute-force sum");
