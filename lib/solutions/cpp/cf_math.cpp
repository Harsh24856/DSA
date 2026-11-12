// numbers in 1..n divisible by a or b (inclusion-exclusion)
long long solve(long long n, long long a, long long b) {
    long long lcm = a / gcd(a, b) * b;                     // divide first to avoid overflow
    return n / a + n / b - n / lcm;
}
