class Solution {
public:
    int superEggDrop(int k, int n) {
        vector<int> dp(k + 1, 0);                        // dp[e]: floors we can settle with e eggs in m moves
        int m = 0;
        while (dp[k] < n) {
            m++;
            for (int e = k; e > 0; e--) dp[e] = dp[e - 1] + dp[e] + 1;   // breaks: below; survives: above
        }
        return m;
    }
};
