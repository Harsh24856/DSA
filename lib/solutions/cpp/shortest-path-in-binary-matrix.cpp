class Solution {
public:
    int shortestPathBinaryMatrix(vector<vector<int>>& grid) {
        int n = grid.size();
        if (grid[0][0] || grid[n - 1][n - 1]) return -1;
        queue<tuple<int, int, int>> q;
        q.push({0, 0, 1});
        grid[0][0] = 1;                                  // mark visited
        while (!q.empty()) {
            auto [r, c, d] = q.front(); q.pop();
            if (r == n - 1 && c == n - 1) return d;
            for (int dr = -1; dr <= 1; dr++)
                for (int dc = -1; dc <= 1; dc++) {       // all 8 directions
                    int nr = r + dr, nc = c + dc;
                    if (nr >= 0 && nr < n && nc >= 0 && nc < n && grid[nr][nc] == 0) {
                        grid[nr][nc] = 1;
                        q.push({nr, nc, d + 1});
                    }
                }
        }
        return -1;
    }
};
