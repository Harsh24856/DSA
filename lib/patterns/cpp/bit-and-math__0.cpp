// single bits (i counts from 0 at the right); use 1LL << i above bit 30
int getBit(int x, int i) { return (x >> i) & 1; }
int setBit(int x, int i) { return x | (1 << i); }
int clearBit(int x, int i) { return x & ~(1 << i); }
int toggleBit(int x, int i) { return x ^ (1 << i); }

// Kernighan: x & (x - 1) clears the lowest set bit, so loop once per set bit
int popcount(unsigned x) {
    int count = 0;
    while (x) { x &= x - 1; count++; }
    return count;
}
int lowestBit(int x) { return x & -x; }            // undefined for INT_MIN: use unsigned there
bool isPow2(long long x) { return x > 0 && (x & (x - 1)) == 0; }

// the 8-bit pattern that stores x, and back
string toTwos(int x) { return bitset<8>((unsigned char)x).to_string(); }
int fromTwos(const string& bits) { return (int8_t)stoi(bits, nullptr, 2); }

long long gcdOf(long long a, long long b) {        // Euclid: gcd(a, b) = gcd(b, a mod b)
    while (b) { long long t = a % b; a = b; b = t; }
    return llabs(a);
}
long long lcmOf(long long a, long long b) { return a / gcdOf(a, b) * b; }   // divide first

vector<int> sieve(int n) {                         // all primes up to n, O(n log log n)
    vector<bool> isP(n + 1, true);
    vector<int> out;
    for (long long p = 2; p <= n; p++) {
        if (!isP[p]) continue;
        out.push_back(p);
        for (long long m = p * p; m <= n; m += p) isP[m] = false;   // smaller multiples are done
    }
    return out;
}
bool isPrime(long long n) {
    if (n < 2) return false;
    for (long long i = 2; i * i <= n; i++) if (n % i == 0) return false;
    return true;
}

long long powMod(long long a, long long e, long long m) {   // O(log e) multiplications
    long long result = 1 % m;
    a %= m;
    if (a < 0) a += m;
    while (e) {
        if (e & 1) result = result * a % m;        // operands below m < 2^31: the product fits
        a = a * a % m;
        e >>= 1;
    }
    return result;
}
long long modInverse(long long a, long long p) { return powMod(a, p - 2, p); }   // Fermat, p prime
long long modSafe(long long a, long long m) { return ((a % m) + m) % m; }      // C++ % can be negative
// @test
    int x = 0b101100;                              // 44
    H::check(getBit(x, 2), 1, "get bit 2");
    H::check(getBit(x, 0), 0, "get bit 0");
    H::check(setBit(x, 0), 45, "set bit");
    H::check(clearBit(x, 2), 40, "clear bit");
    H::check(toggleBit(x, 5), 12, "toggle bit");
    H::check(popcount(x), 3, "popcount");
    H::check(popcount(x), __builtin_popcount(x), "popcount matches the builtin");
    H::check(lowestBit(x), 4, "lowest set bit");
    H::check(isPow2(64) && !isPow2(44) && !isPow2(0), true, "power of two");
    H::check(toTwos(-44), string("11010100"), "two's complement of -44");
    H::check(fromTwos("11010100"), -44, "read back as signed");
    H::check(~x == -x - 1, true, "~x = -x - 1");
    H::check(-7 >> 1, -4, "arithmetic shift rounds down");
    H::check(-7 / 2, -3, "division truncates toward zero");
    H::check(-7 % 3, -1, "remainder takes the sign of the dividend");
    H::check(modSafe(-7, 3), 2LL, "safe mod");
    H::check(gcdOf(252, 105), 21LL, "gcd");
    H::check(gcdOf(0, 5), 5LL, "gcd with zero");
    H::check(lcmOf(4, 6), 12LL, "lcm");
    H::check(sieve(30), vector<int>{2, 3, 5, 7, 11, 13, 17, 19, 23, 29}, "sieve");
    H::check(isPrime(97) && !isPrime(91) && !isPrime(1), true, "trial division");
    H::check(powMod(3, 13, 1000), 323LL, "3^13 mod 1000");
    H::check(powMod(2, 10, 1), 0LL, "mod 1");
    const long long M = 1'000'000'007;
    H::check(modInverse(3, M) * 3 % M, 1LL, "modular inverse");
    H::check((long long)INT_MAX + 1, 2147483648LL, "widen before adding");
