class Solution {
public:
    int minCost(vector<vector<int>>& grid) {
        int m = grid.size(), n = grid[0].size();
        int dr[] = {0, 0, 1, -1}, dc[] = {1, -1, 0, 0};       // signs 1 right, 2 left, 3 down, 4 up
        vector<vector<int>> dist(m, vector<int>(n, INT_MAX));
        deque<array<int, 3>> dq;
        dist[0][0] = 0;
        dq.push_back({0, 0, 0});
        while (!dq.empty()) {
            auto [d, r, c] = dq.front(); dq.pop_front();
            if (d > dist[r][c]) continue;
            if (r == m - 1 && c == n - 1) return d;
            for (int k = 0; k < 4; k++) {
                int nr = r + dr[k], nc = c + dc[k];
                if (nr < 0 || nr >= m || nc < 0 || nc >= n) continue;
                int w = grid[r][c] == k + 1 ? 0 : 1;
                if (d + w < dist[nr][nc]) {
                    dist[nr][nc] = d + w;
                    if (w) dq.push_back({d + 1, nr, nc});
                    else dq.push_front({d, nr, nc});
                }
            }
        }
        return dist[m - 1][n - 1];
    }
};
