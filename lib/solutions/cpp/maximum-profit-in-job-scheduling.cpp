class Solution {
public:
    int jobScheduling(vector<int>& startTime, vector<int>& endTime, vector<int>& profit) {
        int n = startTime.size();
        vector<array<int, 3>> jobs(n);
        for (int i = 0; i < n; i++) jobs[i] = {endTime[i], startTime[i], profit[i]};
        sort(jobs.begin(), jobs.end());                  // by end
        vector<int> ends(n), dp(n + 1, 0);               // dp[k] = best profit with the first k jobs
        for (int i = 0; i < n; i++) ends[i] = jobs[i][0];
        for (int k = 1; k <= n; k++) {
            auto [e, s, p] = jobs[k - 1];
            int j = upper_bound(ends.begin(), ends.begin() + k - 1, s) - ends.begin();  // jobs ending by s
            dp[k] = max(dp[k - 1], dp[j] + p);
        }
        return dp[n];
    }
};
