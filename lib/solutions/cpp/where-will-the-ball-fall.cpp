class Solution {
public:
    vector<int> findBall(vector<vector<int>>& grid) {
        int R = grid.size(), C = grid[0].size();
        vector<int> out;
        for (int c = 0; c < C; c++) {
            int col = c;
            for (int r = 0; r < R; r++) {
                int d = grid[r][col], nc = col + d;    // the board pushes the ball one column
                if (nc < 0 || nc >= C || grid[r][nc] != d) { col = -1; break; }   // wall or V shape: stuck
                col = nc;
            }
            out.push_back(col);
        }
        return out;
    }
};
