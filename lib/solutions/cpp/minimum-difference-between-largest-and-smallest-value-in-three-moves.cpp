class Solution {
public:
    int minDifference(vector<int>& nums) {
        int n = nums.size();
        if (n <= 4) return 0;
        sort(nums.begin(), nums.end());
        int best = INT_MAX;
        for (int i = 0; i < 4; i++) best = min(best, nums[n - 4 + i] - nums[i]);   // drop i small, 3 - i big
        return best;
    }
};
