class Solution {
public:
    int shortestBridge(vector<vector<int>>& grid) {
        int n = grid.size();
        const int dr[] = {1, -1, 0, 0}, dc[] = {0, 0, 1, -1};
        queue<pair<int, int>> q;
        vector<pair<int, int>> st;
        for (int r = 0; r < n && st.empty(); r++)
            for (int c = 0; c < n && st.empty(); c++)
                if (grid[r][c]) { grid[r][c] = 2; st.push_back({r, c}); }
        while (!st.empty()) {                              // flood the first island
            auto [r, c] = st.back(); st.pop_back();
            q.push({r, c});
            for (int k = 0; k < 4; k++) {
                int nr = r + dr[k], nc = c + dc[k];
                if (nr >= 0 && nc >= 0 && nr < n && nc < n && grid[nr][nc] == 1) { grid[nr][nc] = 2; st.push_back({nr, nc}); }
            }
        }
        for (int steps = 0; !q.empty(); steps++) {         // grow it one ring at a time
            for (int s = q.size(); s > 0; s--) {
                auto [r, c] = q.front(); q.pop();
                for (int k = 0; k < 4; k++) {
                    int nr = r + dr[k], nc = c + dc[k];
                    if (nr < 0 || nc < 0 || nr >= n || nc >= n) continue;
                    if (grid[nr][nc] == 1) return steps;
                    if (grid[nr][nc] == 0) { grid[nr][nc] = 2; q.push({nr, nc}); }
                }
            }
        }
        return -1;
    }
};
