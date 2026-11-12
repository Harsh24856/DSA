class Solution {
public:
    int matrixScore(vector<vector<int>>& grid) {
        int R = grid.size(), C = grid[0].size(), total = 0;
        for (int c = 0; c < C; c++) {
            // every row is flipped to start with 1, so a cell is 1 when it equals its row's first cell
            int ones = 0;
            for (int r = 0; r < R; r++) ones += grid[r][c] == grid[r][0];
            total += max(ones, R - ones) << (C - 1 - c);   // then flip the column if that gives more ones
        }
        return total;
    }
};
