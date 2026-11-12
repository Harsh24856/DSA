// number of divisors of n, from its prime factorisation
long long solve(long long n) {
    long long ways = 1;
    for (long long d = 2; d * d <= n; d++) {
        int e = 0;
        while (n % d == 0) { n /= d; e++; }
        ways *= e + 1;
    }
    return n > 1 ? ways * 2 : ways;                        // a prime left over adds exponent 1
}
