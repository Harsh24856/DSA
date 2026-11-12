// a power of two has one set bit, so n & (n - 1) clears it to 0
bool isPowerOfTwo(long long n) { return n > 0 && (n & (n - 1)) == 0; }

// sum without +: XOR adds without carry, AND shifted left is the carry
int getSum(int a, int b) {
    uint32_t x = a, y = b;                     // unsigned: shifting the carry out is well defined
    while (y) {
        uint32_t carry = (x & y) << 1;
        x ^= y;
        y = carry;
    }
    return (int)x;
}
// @test
    H::check(isPowerOfTwo(16), true, "16");
    H::check(isPowerOfTwo(18), false, "18");
    H::check(isPowerOfTwo(0), false, "zero");
    H::check(isPowerOfTwo(-8), false, "negative");
    H::check(getSum(2, 3), 5, "2 + 3");
    H::check(getSum(-1, 1), 0, "-1 + 1");
    H::check(getSum(-12, -8), -20, "negatives");
