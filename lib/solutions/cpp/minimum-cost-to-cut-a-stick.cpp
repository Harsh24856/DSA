class Solution {
public:
    int minCost(int n, vector<int>& cuts) {
        vector<int> c = {0};
        vector<int> s = cuts;
        sort(s.begin(), s.end());
        c.insert(c.end(), s.begin(), s.end());
        c.push_back(n);
        int m = c.size();
        vector<vector<int>> dp(m, vector<int>(m, 0));    // dp[i][j]: cost to make every cut between c[i] and c[j]
        for (int gap = 2; gap < m; gap++)
            for (int i = 0; i + gap < m; i++) {
                int j = i + gap, best = INT_MAX;
                for (int k = i + 1; k < j; k++) best = min(best, dp[i][k] + dp[k][j]);   // k is the first cut
                dp[i][j] = c[j] - c[i] + best;
            }
        return dp[0][m - 1];
    }
};
