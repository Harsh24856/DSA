class Solution {
public:
    int orangesRotting(vector<vector<int>>& grid) {
        int R = grid.size(), C = grid[0].size(), fresh = 0, minutes = 0;
        queue<pair<int, int>> q;
        for (int r = 0; r < R; r++)
            for (int c = 0; c < C; c++) {
                if (grid[r][c] == 2) q.push({r, c});
                else if (grid[r][c] == 1) fresh++;
            }
        int dr[] = {1, -1, 0, 0}, dc[] = {0, 0, 1, -1};
        while (!q.empty() && fresh) {
            minutes++;
            for (int k = q.size(); k > 0; k--) {         // one minute: every rotten orange spreads once
                auto [r, c] = q.front(); q.pop();
                for (int d = 0; d < 4; d++) {
                    int nr = r + dr[d], nc = c + dc[d];
                    if (nr >= 0 && nr < R && nc >= 0 && nc < C && grid[nr][nc] == 1) {
                        grid[nr][nc] = 2; fresh--; q.push({nr, nc});
                    }
                }
            }
        }
        return fresh ? -1 : minutes;
    }
};
