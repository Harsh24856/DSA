class Solution {
public:
    int numPrimeArrangements(int n) {
        const long long MOD = 1'000'000'007;
        int p = 0;
        for (int k = 2; k <= n; k++) {
            bool prime = true;
            for (int d = 2; d * d <= k; d++) if (k % d == 0) { prime = false; break; }
            p += prime;
        }
        long long ans = 1;
        for (int k = 2; k <= p; k++) ans = ans * k % MOD;        // primes on prime spots: p!
        for (int k = 2; k <= n - p; k++) ans = ans * k % MOD;    // the rest: (n - p)!
        return (int)ans;
    }
};
