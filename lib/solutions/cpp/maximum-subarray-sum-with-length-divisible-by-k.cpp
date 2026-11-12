class Solution {
public:
    long long maxSubarraySum(vector<int>& nums, int k) {
        vector<long long> low(k, LLONG_MAX);   // smallest prefix sum at each length mod k
        low[0] = 0;
        long long s = 0, best = LLONG_MIN;
        for (int j = 1; j <= (int)nums.size(); j++) {
            s += nums[j - 1];
            int r = j % k;
            if (low[r] != LLONG_MAX) best = max(best, s - low[r]);   // same remainder: length divisible by k
            low[r] = min(low[r], s);
        }
        return best;
    }
};
