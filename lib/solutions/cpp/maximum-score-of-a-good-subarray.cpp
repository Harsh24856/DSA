class Solution {
public:
    int maximumScore(vector<int>& nums, int k) {
        int n = nums.size(), i = k, j = k;
        int low = nums[k], best = nums[k];
        while (i > 0 || j < n - 1) {
            // grow towards the bigger neighbour so the minimum drops as slowly as possible
            if (i == 0 || (j < n - 1 && nums[j + 1] > nums[i - 1])) low = min(low, nums[++j]);
            else low = min(low, nums[--i]);
            best = max(best, low * (j - i + 1));
        }
        return best;
    }
};
