// Sieve of Eratosthenes: cross out multiples of each prime from p * p
int countPrimes(int n) {                      // primes strictly below n
    if (n < 3) return 0;
    vector<bool> isP(n, true);
    isP[0] = isP[1] = false;
    for (long long p = 2; p * p < n; p++)
        if (isP[p])
            for (long long m = p * p; m < n; m += p) isP[m] = false;
    return count(isP.begin(), isP.end(), true);
}
// @test
    H::check(countPrimes(10), 4, "below 10");
    H::check(countPrimes(0), 0, "zero");
    H::check(countPrimes(2), 0, "below 2");
    H::check(countPrimes(3), 1, "below 3");
    H::check(countPrimes(1000000), 78498, "below a million");
