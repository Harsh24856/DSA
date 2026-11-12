class Solution {
public:
    int minimumObstacles(vector<vector<int>>& grid) {
        int m = grid.size(), n = grid[0].size();
        vector<vector<int>> dist(m, vector<int>(n, INT_MAX));
        dist[0][0] = 0;
        deque<pair<int, int>> dq{{0, 0}};
        const int dr[] = {1, -1, 0, 0}, dc[] = {0, 0, 1, -1};
        while (!dq.empty()) {                  // 0-1 BFS
            auto [r, c] = dq.front();
            dq.pop_front();
            for (int k = 0; k < 4; k++) {
                int nr = r + dr[k], nc = c + dc[k];
                if (nr < 0 || nr >= m || nc < 0 || nc >= n) continue;
                int nd = dist[r][c] + grid[nr][nc];
                if (nd < dist[nr][nc]) {
                    dist[nr][nc] = nd;
                    if (grid[nr][nc]) dq.push_back({nr, nc});   // costs 1: to the back
                    else dq.push_front({nr, nc});               // free: to the front
                }
            }
        }
        return dist[m - 1][n - 1];
    }
};
