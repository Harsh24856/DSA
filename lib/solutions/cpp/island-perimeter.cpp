class Solution {
public:
    int islandPerimeter(vector<vector<int>>& grid) {
        int total = 0;
        for (int r = 0; r < (int)grid.size(); r++)
            for (int c = 0; c < (int)grid[r].size(); c++)
                if (grid[r][c]) {
                    total += 4;
                    if (r && grid[r - 1][c]) total -= 2;   // shared edge with the cell above
                    if (c && grid[r][c - 1]) total -= 2;   // shared edge with the cell to the left
                }
        return total;
    }
};
