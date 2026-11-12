class Solution {
public:
    int maximumSafenessFactor(vector<vector<int>>& grid) {
        int n = grid.size();
        int dr[] = {1, -1, 0, 0}, dc[] = {0, 0, 1, -1};
        vector<vector<int>> dist(n, vector<int>(n, -1));
        queue<pair<int, int>> q;
        for (int r = 0; r < n; r++)
            for (int c = 0; c < n; c++)
                if (grid[r][c]) { dist[r][c] = 0; q.push({r, c}); }
        while (!q.empty()) {                           // multi-source BFS: distance to the nearest thief
            auto [r, c] = q.front(); q.pop();
            for (int d = 0; d < 4; d++) {
                int nr = r + dr[d], nc = c + dc[d];
                if (nr >= 0 && nr < n && nc >= 0 && nc < n && dist[nr][nc] == -1) {
                    dist[nr][nc] = dist[r][c] + 1;
                    q.push({nr, nc});
                }
            }
        }
        priority_queue<tuple<int, int, int>> heap;     // (safeness so far, r, c), safest first
        heap.push({dist[0][0], 0, 0});
        vector<vector<bool>> seen(n, vector<bool>(n, false));
        seen[0][0] = true;
        while (!heap.empty()) {
            auto [s, r, c] = heap.top(); heap.pop();
            if (r == n - 1 && c == n - 1) return s;
            for (int d = 0; d < 4; d++) {
                int nr = r + dr[d], nc = c + dc[d];
                if (nr >= 0 && nr < n && nc >= 0 && nc < n && !seen[nr][nc]) {
                    seen[nr][nc] = true;
                    heap.push({min(s, dist[nr][nc]), nr, nc});   // a path is as safe as its worst cell
                }
            }
        }
        return 0;
    }
};
