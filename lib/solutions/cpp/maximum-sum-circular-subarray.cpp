class Solution {
public:
    int maxSubarraySumCircular(vector<int>& nums) {
        int curMax = 0, curMin = 0, bestMax = nums[0], bestMin = nums[0], total = 0;
        for (int x : nums) {
            curMax = max(x, curMax + x);
            bestMax = max(bestMax, curMax);
            curMin = min(x, curMin + x);
            bestMin = min(bestMin, curMin);
            total += x;
        }
        // wrapping around = total minus the smallest middle part; all negative means no wrap
        return bestMax < 0 ? bestMax : max(bestMax, total - bestMin);
    }
};
