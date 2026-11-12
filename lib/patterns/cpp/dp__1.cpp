// house robber: rob house i (then skip i - 1) or skip it; two variables are enough
int rob(const vector<int>& a) {
    int prev2 = 0, prev1 = 0;
    for (int x : a) {
        int cur = max(prev1, prev2 + x);
        prev2 = prev1;
        prev1 = cur;
    }
    return prev1;
}
// @test
    H::check(rob({1, 2, 3, 1}), 4, "rob 1 and 3");
    H::check(rob({2, 7, 9, 3, 1}), 12, "rob 2, 9, 1");
    H::check(rob({}), 0, "no houses");
    H::check(rob({5}), 5, "one house");
