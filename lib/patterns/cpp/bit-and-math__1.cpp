// bits[i] = bits[i >> 1] + (i & 1): drop the last bit, add it back
vector<int> countBits(int n) {
    vector<int> out(n + 1, 0);
    for (int i = 1; i <= n; i++) out[i] = out[i >> 1] + (i & 1);
    return out;
}

// Kernighan: x & (x - 1) clears the lowest set bit, one step per set bit
int popcountLoop(uint32_t x) {
    int c = 0;
    while (x) { x &= x - 1; c++; }
    return c;
}
// @test
    H::check(countBits(5), vector<int>{0, 1, 1, 2, 1, 2}, "count bits");
    H::check(popcountLoop(11), 3, "popcount 11");
    H::check(popcountLoop(0), 0, "popcount 0");
    H::check(popcountLoop(4294967293u), 31, "popcount high bits");
