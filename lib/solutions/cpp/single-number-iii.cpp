class Solution {
public:
    vector<int> singleNumber(vector<int>& nums) {
        unsigned x = 0;   // unsigned so x & -x never overflows
        for (int v : nums) x ^= v;
        unsigned low = x & -x;   // a bit where the two answers differ
        int a = 0;
        for (int v : nums)
            if (v & low) a ^= v;
        return {a, (int)(x ^ a)};
    }
};
// @test
    vector<int> a{1, 2, 1, 3, 2, 5}, b{-1, 0}, c{0, 1};
    H::check(H::sorted(Solution().singleNumber(a)), vector<int>{3, 5}, "a");
    H::check(H::sorted(Solution().singleNumber(b)), vector<int>{-1, 0}, "b");
    H::check(H::sorted(Solution().singleNumber(c)), vector<int>{0, 1}, "c");
