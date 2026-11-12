class Solution {
public:
    void moveZeroes(vector<int>& nums) {
        int w = 0;                                         // next slot for a non-zero
        for (int r = 0; r < (int)nums.size(); r++)
            if (nums[r] != 0) swap(nums[w++], nums[r]);
    }
};
// @test
    vector<int> a{0, 1, 0, 3, 12}; Solution().moveZeroes(a); H::check(a, vector<int>{1, 3, 12, 0, 0}, "moveZeroes a");
    vector<int> b{0}; Solution().moveZeroes(b); H::check(b, vector<int>{0}, "moveZeroes b");
