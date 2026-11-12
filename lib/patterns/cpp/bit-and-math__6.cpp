// Euclid: gcd(a, b) = gcd(b, a mod b)
long long gcdOf(long long a, long long b) {
    while (b) { long long t = a % b; a = b; b = t; }
    return a;
}

long long lcmOf(long long a, long long b) { return a / gcdOf(a, b) * b; }   // divide first: no overflow
// @test
    H::check(gcdOf(252, 105), 21LL, "gcd");
    H::check(gcdOf(0, 7), 7LL, "gcd with 0");
    H::check(gcdOf(17, 5), 1LL, "coprime");
    H::check(lcmOf(4, 6), 12LL, "lcm");
    H::check(lcmOf(1000000007, 998244353), 998244359987710471LL, "lcm large");
