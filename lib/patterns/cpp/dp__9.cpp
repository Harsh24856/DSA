// digit DP: count x in [0, n] with digit sum target; state (position, sum, tight)
long long countDigitSum(long long n, int target) {
    if (n < 0) return 0;
    string d = to_string(n);
    int L = d.size();
    // memo only for non-tight states; the tight states form a single path
    vector<vector<long long>> memo(L + 1, vector<long long>(target + 1, -1));
    function<long long(int, int, bool)> go = [&](int i, int total, bool tight) -> long long {
        if (total > target) return 0;                    // sums only grow
        if (i == L) return total == target;
        if (!tight && memo[i][total] >= 0) return memo[i][total];
        int hi = tight ? d[i] - '0' : 9;
        long long ways = 0;
        for (int x = 0; x <= hi; x++) ways += go(i + 1, total + x, tight && x == hi);
        if (!tight) memo[i][total] = ways;
        return ways;
    };
    return go(0, 0, true);
}

long long countInRange(long long lo, long long hi, int target) { return countDigitSum(hi, target) - countDigitSum(lo - 1, target); }
// @test
    H::check(countDigitSum(31415, 10), 727LL, "digit sum 10 up to 31415");
    H::check(countInRange(100, 999, 5), 15LL, "three-digit numbers with sum 5");
    H::check(countDigitSum(9, 0), 1LL, "only zero");
    H::check(countDigitSum(1000000000000000000LL, 1), 19LL, "powers of ten up to 1e18");
