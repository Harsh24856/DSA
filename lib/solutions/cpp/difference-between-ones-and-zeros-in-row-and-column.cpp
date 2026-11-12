class Solution {
public:
    vector<vector<int>> onesMinusZeros(vector<vector<int>>& grid) {
        int m = grid.size(), n = grid[0].size();
        vector<int> r(m, 0), c(n, 0);   // ones in each row and column
        for (int i = 0; i < m; i++)
            for (int j = 0; j < n; j++) { r[i] += grid[i][j]; c[j] += grid[i][j]; }
        vector<vector<int>> out(m, vector<int>(n));
        for (int i = 0; i < m; i++)
            for (int j = 0; j < n; j++) out[i][j] = 2 * r[i] + 2 * c[j] - m - n;
        return out;
    }
};
