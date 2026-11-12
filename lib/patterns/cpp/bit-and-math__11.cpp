// every submask of mask, largest first, then 0: (s - 1) & mask is the next smaller one
vector<int> submasks(int mask) {
    vector<int> out;
    for (int s = mask;; s = (s - 1) & mask) {
        out.push_back(s);
        if (s == 0) break;                    // include 0 exactly once
    }
    return out;
}

// SOS DP: F[mask] = sum of a[s] over all submasks s; bit loop outside
vector<long long> sos(const vector<long long>& a, int n) {
    vector<long long> F = a;
    for (int i = 0; i < n; i++)
        for (int mask = 0; mask < (1 << n); mask++)
            if (mask >> i & 1) F[mask] += F[mask ^ (1 << i)];
    return F;
}
// @test
    H::check(submasks(0b1011), vector<int>{11, 10, 9, 8, 3, 2, 1, 0}, "submasks");
    H::check(submasks(0), vector<int>{0}, "submasks of 0");
    H::check(sos({3, 1, 4, 1, 5, 9, 2, 6}, 3), vector<long long>{3, 4, 7, 9, 8, 18, 14, 31}, "sos");
    vector<long long> a(16);
    for (int m = 0; m < 16; m++) a[m] = m * m + 1;
    auto F = sos(a, 4);
    bool ok = true;
    for (int m = 0; m < 16; m++) { long long s = 0; for (int t : submasks(m)) s += a[t]; ok = ok && s == F[m]; }
    H::check(ok, true, "sos matches brute force");
