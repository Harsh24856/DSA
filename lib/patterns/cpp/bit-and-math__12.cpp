const long long MOD = 1'000'000'007;

long long powMod(long long a, long long e) {
    long long r = 1;
    a %= MOD;
    while (e) {
        if (e & 1) r = r * a % MOD;
        a = a * a % MOD;
        e >>= 1;
    }
    return r;
}

// factorials forward, one Fermat inverse for n!, then inverse factorials backward
struct Binom {
    vector<long long> f, inv;
    explicit Binom(int n) : f(n + 1, 1), inv(n + 1, 1) {
        for (int i = 1; i <= n; i++) f[i] = f[i - 1] * i % MOD;
        inv[n] = powMod(f[n], MOD - 2);                 // a^(p-2) is the inverse of a
        for (int i = n; i > 0; i--) inv[i - 1] = inv[i] * i % MOD;
    }
    long long C(int n, int k) const {
        if (k < 0 || k > n) return 0;
        return f[n] * inv[k] % MOD * inv[n - k] % MOD;  // every product in 64 bits
    }
};
// @test
    Binom b(1000);
    H::check(b.C(6, 2), 15LL, "C(6, 2)");
    H::check(b.C(5, 7), 0LL, "k > n");
    H::check(b.C(1000, 500), 159835829LL, "C(1000, 500) mod p");
    H::check(b.f[5] * b.inv[5] % MOD, 1LL, "inverse factorial");
    H::check(powMod(3, MOD - 2) * 3 % MOD, 1LL, "Fermat inverse of 3");
