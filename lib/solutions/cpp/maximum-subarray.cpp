class Solution {
public:
    int maxSubArray(vector<int>& nums) {
        int run = nums[0], best = nums[0];
        for (size_t i = 1; i < nums.size(); i++) {
            run = max(nums[i], run + nums[i]);             // extend or start fresh
            best = max(best, run);
        }
        return best;
    }
};
