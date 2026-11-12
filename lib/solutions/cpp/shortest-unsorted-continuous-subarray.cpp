class Solution {
public:
    int findUnsortedSubarray(vector<int>& nums) {
        int n = nums.size(), start = 0, end = -1;
        int mx = nums[0], mn = nums[n - 1];
        for (int i = 0; i < n; i++) {
            mx = max(mx, nums[i]);
            if (nums[i] < mx) end = i;     // smaller than something before it
            int j = n - 1 - i;
            mn = min(mn, nums[j]);
            if (nums[j] > mn) start = j;   // bigger than something after it
        }
        return end - start + 1;
    }
};
