class Solution {
public:
    int minHeightShelves(vector<vector<int>>& books, int shelfWidth) {
        int n = books.size();
        vector<int> dp(n + 1, INT_MAX);   // dp[i] = least height for the first i books
        dp[0] = 0;
        for (int i = 1; i <= n; i++) {
            int w = 0, h = 0;
            for (int j = i; j > 0; j--) {     // books j..i on the last shelf
                w += books[j - 1][0];
                if (w > shelfWidth) break;
                h = max(h, books[j - 1][1]);
                dp[i] = min(dp[i], dp[j - 1] + h);
            }
        }
        return dp[n];
    }
};
