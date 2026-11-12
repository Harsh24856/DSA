class Solution {
    int R, C;

    int dfs(vector<vector<int>>& grid, int r, int c, int left) {
        if (r < 0 || r >= R || c < 0 || c >= C || grid[r][c] < 0) return 0;
        if (grid[r][c] == 2) return left == 0;   // reached the end having walked every square
        grid[r][c] = -1;   // mark visited
        int total = dfs(grid, r + 1, c, left - 1) + dfs(grid, r - 1, c, left - 1) + dfs(grid, r, c + 1, left - 1) + dfs(grid, r, c - 1, left - 1);
        grid[r][c] = 0;    // undo
        return total;
    }

public:
    int uniquePathsIII(vector<vector<int>>& grid) {
        R = grid.size();
        C = grid[0].size();
        int need = 1, sr = 0, sc = 0;   // empty squares plus the end square
        for (int r = 0; r < R; r++)
            for (int c = 0; c < C; c++) {
                if (grid[r][c] == 0) need++;
                if (grid[r][c] == 1) { sr = r; sc = c; }
            }
        return dfs(grid, sr, sc, need);
    }
};
