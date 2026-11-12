// each update (l, r, v) writes +v at l and -v at r + 1; one prefix pass rebuilds the final values
vector<long long> applyUpdates(int n, const vector<array<int, 3>>& updates) {
    vector<long long> diff(n + 1, 0), out(n);           // n + 1 slots so r + 1 never falls off the end
    for (auto [l, r, v] : updates) {
        diff[l] += v;
        diff[r + 1] -= v;
    }
    long long run = 0;
    for (int i = 0; i < n; i++) out[i] = run += diff[i];
    return out;
}
// @test
    H::check(applyUpdates(7, {{1, 3, 2}, {2, 5, 3}, {0, 1, 1}}), vector<long long>{1, 3, 5, 5, 3, 3, 0}, "three updates");
    H::check(applyUpdates(3, {}), vector<long long>{0, 0, 0}, "no updates");
    H::check(applyUpdates(2, {{0, 1, 5}, {1, 1, -2}}), vector<long long>{5, 3}, "negative");
