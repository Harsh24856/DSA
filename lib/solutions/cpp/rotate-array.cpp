class Solution {
public:
    void rotate(vector<int>& nums, int k) {
        int n = nums.size();
        k %= n;
        reverse(nums.begin(), nums.end());                 // reverse all, then each part
        reverse(nums.begin(), nums.begin() + k);
        reverse(nums.begin() + k, nums.end());
    }
};
// @test
    vector<int> a{1, 2, 3, 4, 5, 6, 7}; Solution().rotate(a, 3); H::check(a, vector<int>{5, 6, 7, 1, 2, 3, 4}, "rotate a");
    vector<int> b{-1, -100, 3, 99}; Solution().rotate(b, 2); H::check(b, vector<int>{3, 99, -1, -100}, "rotate b");
