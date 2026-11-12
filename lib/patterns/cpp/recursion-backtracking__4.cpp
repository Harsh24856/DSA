// plain recursion plus a cache: each state is solved once
long long climb(int n) {
    vector<long long> memo(n + 1, -1);           // -1 = not computed (never a valid answer here)
    function<long long(int)> f = [&](int i) -> long long {
        if (i <= 1) return 1;
        if (memo[i] >= 0) return memo[i];
        return memo[i] = f(i - 1) + f(i - 2);
    };
    return f(n);
}
// @test
    H::check(climb(2), 2LL, "two steps");
    H::check(climb(3), 3LL, "three steps");
    H::check(climb(5), 8LL, "five steps");
    H::check(climb(45), 1836311903LL, "large n is fast");
