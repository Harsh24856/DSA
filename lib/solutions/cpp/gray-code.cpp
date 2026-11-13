class Solution {
public:
    vector<int> grayCode(int n) {
        vector<int> out;
        for (int i = 0; i < (1 << n); i++) out.push_back(i ^ (i >> 1));
        return out;
    }
};
// @test
    H::check(Solution().grayCode(2), vector<int>{0, 1, 3, 2}, "n = 2");
    H::check(Solution().grayCode(1), vector<int>{0, 1}, "n = 1");
    vector<int> g = Solution().grayCode(10);
    bool ok = H::sorted(g) == [] { vector<int> v(1024); iota(v.begin(), v.end(), 0); return v; }();
    for (int i = 0; i < 1024; i++) ok = ok && __builtin_popcount(g[i] ^ g[(i + 1) % 1024]) == 1;
    H::check(ok, true, "n = 10 is a permutation with one-bit steps");
