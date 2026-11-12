class Solution {
public:
    int cherryPickup(vector<vector<int>>& grid) {
        int n = grid.size();
        const int NEG = INT_MIN;   // unreachable
        // two walkers move together; after t steps walker k is at (rk, t - rk)
        vector<vector<int>> dp(n, vector<int>(n, NEG));
        dp[0][0] = grid[0][0];
        for (int t = 1; t < 2 * n - 1; t++) {
            vector<vector<int>> nxt(n, vector<int>(n, NEG));
            for (int r1 = max(0, t - n + 1); r1 < min(n, t + 1); r1++)
                for (int r2 = max(0, t - n + 1); r2 < min(n, t + 1); r2++) {
                    int c1 = t - r1, c2 = t - r2;
                    if (grid[r1][c1] < 0 || grid[r2][c2] < 0) continue;
                    int best = NEG;
                    for (int a : {r1 - 1, r1})
                        for (int b : {r2 - 1, r2})
                            if (a >= 0 && b >= 0) best = max(best, dp[a][b]);
                    if (best == NEG) continue;
                    int gain = grid[r1][c1] + (r1 != r2 ? grid[r2][c2] : 0);   // same cell counts once
                    nxt[r1][r2] = best + gain;
                }
            dp = nxt;
        }
        return max(0, dp[n - 1][n - 1]);
    }
};
