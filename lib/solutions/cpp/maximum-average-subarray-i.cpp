class Solution {
public:
    double findMaxAverage(vector<int>& nums, int k) {
        int s = accumulate(nums.begin(), nums.begin() + k, 0), best = s;
        for (int i = k; i < (int)nums.size(); i++) {
            s += nums[i] - nums[i - k];                    // slide the window by one
            best = max(best, s);
        }
        return (double)best / k;
    }
};
