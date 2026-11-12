// earliest end first: it leaves the most room for everything after it
int maxNonOverlap(vector<vector<int>> iv) {
    sort(iv.begin(), iv.end(), [](auto& a, auto& b) { return a[1] < b[1]; });
    long long end = LLONG_MIN;
    int count = 0;
    for (auto& x : iv)
        if (x[0] >= end) { count++; end = x[1]; }
    return count;
}
// @test
    H::check(maxNonOverlap({{1, 2}, {2, 3}, {3, 4}, {1, 3}}), 3, "touching is fine");
    H::check(maxNonOverlap({{1, 2}, {1, 2}, {1, 2}}), 1, "duplicates");
    H::check(maxNonOverlap({{1, 10}, {2, 3}, {4, 5}, {6, 7}}), 3, "long interval loses");
    H::check(maxNonOverlap({}), 0, "empty");
