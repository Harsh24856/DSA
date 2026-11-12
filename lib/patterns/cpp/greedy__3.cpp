// unlimited trades: take every positive day-to-day change
int maxProfit(const vector<int>& p) {
    int profit = 0;
    for (size_t i = 1; i < p.size(); i++) profit += max(0, p[i] - p[i - 1]);
    return profit;
}
// @test
    H::check(maxProfit({7, 1, 5, 3, 6, 4}), 7, "two rises");
    H::check(maxProfit({1, 2, 3, 4, 5}), 4, "one long rise");
    H::check(maxProfit({7, 6, 4, 3, 1}), 0, "only falls");
