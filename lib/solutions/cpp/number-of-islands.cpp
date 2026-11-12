class Solution {
    void sink(vector<vector<char>>& grid, int r, int c) {
        if (r < 0 || r >= (int)grid.size() || c < 0 || c >= (int)grid[0].size() || grid[r][c] != '1') return;
        grid[r][c] = '0';
        sink(grid, r + 1, c); sink(grid, r - 1, c); sink(grid, r, c + 1); sink(grid, r, c - 1);
    }

public:
    int numIslands(vector<vector<char>>& grid) {
        int count = 0;
        for (int r = 0; r < (int)grid.size(); r++)
            for (int c = 0; c < (int)grid[0].size(); c++)
                if (grid[r][c] == '1') { count++; sink(grid, r, c); }   // a new island: sink all of it
        return count;
    }
};
