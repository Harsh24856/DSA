// square the base each step; multiply it in when the current bit of n is 1
double myPow(double x, long long n) {        // long long: -n is safe for n = INT_MIN
    if (n < 0) { x = 1 / x; n = -n; }
    double res = 1.0;
    while (n) {
        if (n & 1) res *= x;
        x *= x;
        n >>= 1;
    }
    return res;
}

long long powMod(long long a, long long e, long long m) {
    long long r = 1;
    a %= m;
    while (e) {
        if (e & 1) r = r * a % m;
        a = a * a % m;
        e >>= 1;
    }
    return r;
}
// @test
    H::checkNear(myPow(2.0, 10), 1024.0, "2^10");
    H::checkNear(myPow(2.1, 3), 9.261, "2.1^3");
    H::checkNear(myPow(2.0, -2), 0.25, "negative exponent");
    H::checkNear(myPow(1.0, INT_MIN), 1.0, "INT_MIN exponent");
    H::check(powMod(3, 13, 1000000007), 1594323LL, "3^13");
    H::check(powMod(2, 1000000006, 1000000007), 1LL, "Fermat");
