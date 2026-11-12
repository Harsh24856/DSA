class Solution {
public:
    int minimumAverageDifference(vector<int>& nums) {
        long long n = nums.size(), total = accumulate(nums.begin(), nums.end(), 0LL), pre = 0, best = LLONG_MAX;
        int ans = 0;
        for (int i = 0; i < n; i++) {
            pre += nums[i];
            long long left = pre / (i + 1);
            long long right = i < n - 1 ? (total - pre) / (n - i - 1) : 0;
            if (llabs(left - right) < best) {
                best = llabs(left - right);
                ans = i;
            }
        }
        return ans;
    }
};
