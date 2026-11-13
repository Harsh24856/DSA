class Solution {
public:
    int longestIncreasingPath(vector<vector<int>>& matrix) {
        int R = matrix.size(), C = matrix[0].size(), ans = 0;
        vector<vector<int>> memo(R, vector<int>(C, 0));
        int dr[4] = {1, -1, 0, 0}, dc[4] = {0, 0, 1, -1};
        function<int(int, int)> dfs = [&](int r, int c) -> int {
            if (memo[r][c]) return memo[r][c];
            int best = 1;
            for (int k = 0; k < 4; k++) {
                int nr = r + dr[k], nc = c + dc[k];
                if (nr >= 0 && nr < R && nc >= 0 && nc < C && matrix[nr][nc] > matrix[r][c])
                    best = max(best, 1 + dfs(nr, nc));
            }
            return memo[r][c] = best;
        };
        for (int r = 0; r < R; r++)
            for (int c = 0; c < C; c++) ans = max(ans, dfs(r, c));
        return ans;
    }
};
