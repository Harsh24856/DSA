class Solution {
public:
    vector<int> searchRange(vector<int>& nums, int target) {
        int lo = lower_bound(nums.begin(), nums.end(), target) - nums.begin();
        if (lo == (int)nums.size() || nums[lo] != target) return {-1, -1};
        int hi = upper_bound(nums.begin(), nums.end(), target) - nums.begin() - 1;   // last copy
        return {lo, hi};
    }
};
