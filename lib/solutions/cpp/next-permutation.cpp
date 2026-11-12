class Solution {
public:
    void nextPermutation(vector<int>& nums) {
        int i = nums.size() - 2;
        while (i >= 0 && nums[i] >= nums[i + 1]) i--;      // rightmost ascent
        if (i >= 0) {
            int j = nums.size() - 1;
            while (nums[j] <= nums[i]) j--;                // smallest bigger value to its right
            swap(nums[i], nums[j]);
        }
        reverse(nums.begin() + i + 1, nums.end());
    }
};
// @test
    vector<vector<int>> in{{1, 2, 3}, {3, 2, 1}, {1, 1, 5}, {2, 4, 7, 6, 3, 1}};
    vector<vector<int>> want{{1, 3, 2}, {1, 2, 3}, {1, 5, 1}, {2, 6, 1, 3, 4, 7}};
    for (size_t t = 0; t < in.size(); t++) { Solution().nextPermutation(in[t]); H::check(in[t], want[t], "nextPermutation " + to_string(t)); }
