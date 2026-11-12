class Solution {
public:
    vector<vector<int>> updateMatrix(vector<vector<int>>& mat) {
        int R = mat.size(), C = mat[0].size();
        vector<vector<int>> dist(R, vector<int>(C, -1));     // -1: not reached yet
        queue<pair<int, int>> q;
        for (int r = 0; r < R; r++)
            for (int c = 0; c < C; c++)
                if (mat[r][c] == 0) { dist[r][c] = 0; q.push({r, c}); }   // BFS from every 0 at once
        int dr[] = {1, -1, 0, 0}, dc[] = {0, 0, 1, -1};
        while (!q.empty()) {
            auto [r, c] = q.front(); q.pop();
            for (int d = 0; d < 4; d++) {
                int nr = r + dr[d], nc = c + dc[d];
                if (nr >= 0 && nr < R && nc >= 0 && nc < C && dist[nr][nc] == -1) {
                    dist[nr][nc] = dist[r][c] + 1;
                    q.push({nr, nc});
                }
            }
        }
        return dist;
    }
};
