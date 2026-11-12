class Solution {
    static constexpr long long MOD = 1'000'000'007;
    long long power(long long b, long long e) {              // fast power mod MOD
        long long r = 1;
        for (b %= MOD; e; e >>= 1, b = b * b % MOD)
            if (e & 1) r = r * b % MOD;
        return r;
    }
public:
    int countGoodNumbers(long long n) {
        // 5 even digits for each even index, 4 primes for each odd index
        return (int)(power(5, (n + 1) / 2) * power(4, n / 2) % MOD);
    }
};
