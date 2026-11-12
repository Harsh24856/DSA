class Solution {
public:
    int waysToSplitArray(vector<int>& nums) {
        long long total = accumulate(nums.begin(), nums.end(), 0LL), left = 0;
        int ways = 0;
        for (size_t i = 0; i + 1 < nums.size(); i++) {
            left += nums[i];
            if (left >= total - left) ways++;
        }
        return ways;
    }
};
