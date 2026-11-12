// Tarjan low-links: tree edge u-v is a bridge when low[v] > tin[u]; cut vertex when low[v] >= tin[u]
pair<vector<vector<int>>, vector<int>> bridgesAndPoints(int n, const vector<vector<int>>& edges) {
    vector<vector<pair<int, int>>> adj(n);
    for (int i = 0; i < (int)edges.size(); i++) {
        adj[edges[i][0]].push_back({edges[i][1], i});
        adj[edges[i][1]].push_back({edges[i][0], i});
    }
    vector<int> tin(n, -1), low(n, 0);
    vector<bool> cut(n, false);
    vector<vector<int>> bridges;
    int timer = 0;
    function<void(int, int)> dfs = [&](int u, int via) {   // via = id of the entry edge
        tin[u] = low[u] = timer++;
        int kids = 0;
        for (auto [v, i] : adj[u]) {
            if (i == via) continue;                          // skip the edge, not the node
            if (tin[v] >= 0) { low[u] = min(low[u], tin[v]); continue; }   // back edge
            dfs(v, i); kids++;
            low[u] = min(low[u], low[v]);
            if (low[v] > tin[u]) bridges.push_back(edges[i]);
            if (via >= 0 && low[v] >= tin[u]) cut[u] = true;
        }
        if (via < 0 && kids > 1) cut[u] = true;              // root rule
    };
    for (int s = 0; s < n; s++) if (tin[s] < 0) dfs(s, -1);
    vector<int> points;
    for (int u = 0; u < n; u++) if (cut[u]) points.push_back(u);
    return {bridges, points};
}
// @test
    auto [b, p] = bridgesAndPoints(7, {{0, 1}, {1, 2}, {2, 0}, {1, 3}, {3, 4}, {4, 5}, {5, 3}, {5, 6}});
    H::check(H::sorted(b), vector<vector<int>>{{1, 3}, {5, 6}}, "bridges");
    H::check(p, vector<int>{1, 3, 5}, "articulation points");
    auto [b2, p2] = bridgesAndPoints(4, {{0, 1}, {1, 2}, {2, 0}, {1, 3}});
    H::check(b2, vector<vector<int>>{{1, 3}}, "critical connection");
    auto [b3, p3] = bridgesAndPoints(2, {{0, 1}, {0, 1}});
    H::check(b3.size(), (size_t)0, "parallel edges are not bridges");
    auto [b4, p4] = bridgesAndPoints(3, {{0, 1}, {0, 2}});
    H::check(p4, vector<int>{0}, "root with two children");
