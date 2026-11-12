// 0-1 BFS: a deque kept sorted by distance; weight 0 goes to the front, weight 1 to the back
vector<int> zeroOneBfs(int n, const vector<array<int, 3>>& edges, int src) {
    vector<vector<pair<int, int>>> adj(n);
    for (auto [u, v, w] : edges) adj[u].push_back({v, w});   // directed; add {v, u, w} too if undirected
    vector<int> dist(n, INT_MAX);
    dist[src] = 0;
    deque<int> dq{src};
    while (!dq.empty()) {
        int u = dq.front(); dq.pop_front();                    // always a smallest distance
        for (auto [v, w] : adj[u]) {
            if (dist[u] + w < dist[v]) {
                dist[v] = dist[u] + w;
                if (w == 0) dq.push_front(v);                  // same distance: front
                else dq.push_back(v);                          // one more: back
            }
        }
    }
    return dist;                                               // INT_MAX = unreachable
}
// @test
    vector<array<int, 3>> e = {{0, 1, 1}, {0, 2, 0}, {2, 1, 0}, {1, 3, 1}, {2, 4, 1}, {3, 5, 0}, {4, 3, 0}, {4, 5, 1}};
    vector<array<int, 3>> both = e;
    for (auto [u, v, w] : e) both.push_back({v, u, w});
    H::check(zeroOneBfs(6, both, 0), vector<int>{0, 0, 0, 1, 1, 1}, "undirected 0/1 graph");
    H::check(zeroOneBfs(3, {{0, 1, 1}, {1, 2, 0}}, 0), vector<int>{0, 1, 1}, "zero edge keeps distance");
    H::check(zeroOneBfs(3, {{0, 1, 1}}, 0)[2], INT_MAX, "unreachable");
    vector<vector<int>> g = {{0, 1, 1}, {1, 1, 0}, {1, 1, 0}};
    vector<array<int, 3>> grid;
    int dr[] = {1, -1, 0, 0}, dc[] = {0, 0, 1, -1};
    for (int r = 0; r < 3; r++)
        for (int c = 0; c < 3; c++)
            for (int d = 0; d < 4; d++) {
                int nr = r + dr[d], nc = c + dc[d];
                if (nr >= 0 && nr < 3 && nc >= 0 && nc < 3) grid.push_back({r * 3 + c, nr * 3 + nc, g[nr][nc]});
            }
    H::check(zeroOneBfs(9, grid, 0)[8], 2, "obstacle removal grid");
