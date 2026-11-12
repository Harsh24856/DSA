class Solution {
public:
    int minSessions(vector<int>& tasks, int sessionTime) {
        int n = tasks.size();
        vector<pair<int, int>> dp(1 << n, {n + 1, 0});   // per set of done tasks: (sessions, time used in the last)
        dp[0] = {1, 0};
        for (int mask = 0; mask < (1 << n); mask++) {
            auto [s, used] = dp[mask];
            for (int i = 0; i < n; i++)
                if (!(mask >> i & 1)) {
                    int t = tasks[i];
                    pair<int, int> nxt = used + t <= sessionTime ? pair{s, used + t} : pair{s + 1, t};
                    int m2 = mask | 1 << i;
                    dp[m2] = min(dp[m2], nxt);
                }
        }
        return dp.back().first;
    }
};
