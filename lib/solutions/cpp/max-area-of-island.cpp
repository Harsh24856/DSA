class Solution {
    int area(vector<vector<int>>& grid, int r, int c) {
        if (r < 0 || r >= (int)grid.size() || c < 0 || c >= (int)grid[0].size() || grid[r][c] != 1) return 0;
        grid[r][c] = 0;                                  // sink it so it is counted once
        return 1 + area(grid, r + 1, c) + area(grid, r - 1, c) + area(grid, r, c + 1) + area(grid, r, c - 1);
    }

public:
    int maxAreaOfIsland(vector<vector<int>>& grid) {
        int best = 0;
        for (int r = 0; r < (int)grid.size(); r++)
            for (int c = 0; c < (int)grid[0].size(); c++) best = max(best, area(grid, r, c));
        return best;
    }
};
