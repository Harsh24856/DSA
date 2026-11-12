// three states per day; update all of them from yesterday's values at once
int maxProfitCooldown(const vector<int>& prices) {
    long long hold = LLONG_MIN / 2, sold = 0, rest = 0;
    for (int p : prices) {
        long long h = max(hold, rest - p), s = hold + p, r = max(rest, sold);
        hold = h; sold = s; rest = r;
    }
    return max(sold, rest);
}
// @test
    H::check(maxProfitCooldown({1, 2, 3, 0, 2}), 3, "cooldown");
    H::check(maxProfitCooldown({1}), 0, "one day");
    H::check(maxProfitCooldown({5, 4, 3}), 0, "falling");
