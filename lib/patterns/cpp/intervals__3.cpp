// keep the interval that ends first; removals = n - kept
int eraseOverlapIntervals(vector<vector<int>> iv) {
    sort(iv.begin(), iv.end(), [](auto& a, auto& b) { return a[1] < b[1]; });   // by END
    long long end = LLONG_MIN;
    int kept = 0;
    for (auto& v : iv)
        if (v[0] >= end) { kept++; end = v[1]; }
    return (int)iv.size() - kept;
}
// @test
    H::check(eraseOverlapIntervals({{1, 2}, {2, 3}, {3, 4}, {1, 3}}), 1, "classic");
    H::check(eraseOverlapIntervals({{1, 2}, {1, 2}, {1, 2}}), 2, "identical");
    H::check(eraseOverlapIntervals({{1, 2}, {2, 3}}), 0, "touching is fine");
    H::check(eraseOverlapIntervals({{1, 100}, {11, 22}, {1, 11}, {2, 12}}), 2, "long one goes");
