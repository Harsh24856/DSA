class Solution {
public:
    int minimumTotal(vector<vector<int>>& triangle) {
        vector<int> dp = triangle.back();                // best path from each cell of the bottom row
        for (int i = (int)triangle.size() - 2; i >= 0; i--)
            for (int j = 0; j < (int)triangle[i].size(); j++) dp[j] = triangle[i][j] + min(dp[j], dp[j + 1]);
        return dp[0];
    }
};
