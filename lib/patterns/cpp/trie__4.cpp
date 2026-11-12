// binary trie from the top bit down; for each x prefer the opposite bit at every level
int findMaximumXOR(const vector<int>& nums, int W = 30) {
    vector<array<int, 2>> t(1, {0, 0});           // t[0] is the root, 0 = no child
    for (int x : nums) {
        int n = 0;
        for (int b = W; b >= 0; b--) {
            int bit = x >> b & 1;
            if (!t[n][bit]) { t[n][bit] = t.size(); t.push_back({0, 0}); }
            n = t[n][bit];
        }
    }
    int best = 0;
    for (int x : nums) {
        int n = 0, cur = 0;
        for (int b = W; b >= 0; b--) {
            int bit = x >> b & 1;
            if (t[n][!bit]) { cur |= 1 << b; n = t[n][!bit]; }   // a differing bit here beats all lower bits
            else n = t[n][bit];
        }
        best = max(best, cur);
    }
    return best;
}
// @test
    H::check(findMaximumXOR({3, 10, 5, 25, 2, 8}), 28, "max xor");
    H::check(findMaximumXOR({14, 70, 53, 83, 49, 91, 36, 80, 92, 51, 66, 70}), 127, "max xor 2");
    H::check(findMaximumXOR({7}), 0, "single number");
    H::check(findMaximumXOR({0, 2147483647}), 2147483647, "full width");
