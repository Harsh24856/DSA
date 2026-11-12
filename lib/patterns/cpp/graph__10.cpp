// multi-source BFS: every 0 starts in the queue at distance 0
vector<vector<int>> nearestZero(const vector<vector<int>>& mat) {
    int R = mat.size(), C = mat[0].size();
    vector<vector<int>> dist(R, vector<int>(C, -1));
    queue<pair<int, int>> q;
    for (int r = 0; r < R; r++)
        for (int c = 0; c < C; c++)
            if (mat[r][c] == 0) { dist[r][c] = 0; q.push({r, c}); }
    int dr[] = {1, -1, 0, 0}, dc[] = {0, 0, 1, -1};
    while (!q.empty()) {
        auto [r, c] = q.front(); q.pop();
        for (int d = 0; d < 4; d++) {
            int nr = r + dr[d], nc = c + dc[d];
            if (nr >= 0 && nr < R && nc >= 0 && nc < C && dist[nr][nc] < 0) {
                dist[nr][nc] = dist[r][c] + 1;
                q.push({nr, nc});
            }
        }
    }
    return dist;
}
// @test
    H::check(nearestZero({{0, 0, 0}, {0, 1, 0}, {1, 1, 1}}), vector<vector<int>>{{0, 0, 0}, {0, 1, 0}, {1, 2, 1}}, "01 matrix");
    H::check(nearestZero({{1, 1, 1, 1, 0}, {1, 1, 1, 1, 1}, {1, 1, 0, 1, 1}, {1, 1, 1, 1, 1}}),
             vector<vector<int>>{{4, 3, 2, 1, 0}, {3, 2, 1, 2, 1}, {2, 1, 0, 1, 2}, {3, 2, 1, 2, 3}}, "two sources");
