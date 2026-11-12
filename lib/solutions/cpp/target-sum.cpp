class Solution {
public:
    int findTargetSumWays(vector<int>& nums, int target) {
        int total = accumulate(nums.begin(), nums.end(), 0);
        if (abs(target) > total || (total + target) % 2) return 0;
        int P = (total + target) / 2;                        // sum of the numbers given a plus sign
        vector<int> dp(P + 1, 0);
        dp[0] = 1;
        for (int x : nums)
            for (int s = P; s >= x; s--) dp[s] += dp[s - x];  // count subsets summing to P
        return dp[P];
    }
};
