// one DFS per unvisited node = one connected component
int countComponents(int n, const vector<vector<int>>& edges) {
    vector<vector<int>> adj(n);
    for (auto& e : edges) { adj[e[0]].push_back(e[1]); adj[e[1]].push_back(e[0]); }
    vector<bool> seen(n, false);
    function<void(int)> dfs = [&](int u) {
        seen[u] = true;                        // mark on entry
        for (int v : adj[u]) if (!seen[v]) dfs(v);
    };
    int comps = 0;
    for (int u = 0; u < n; u++)
        if (!seen[u]) { dfs(u); comps++; }
    return comps;
}
// @test
    H::check(countComponents(5, {{0, 1}, {1, 2}, {3, 4}}), 2, "two components");
    H::check(countComponents(5, {{0, 1}, {1, 2}, {2, 3}, {3, 4}}), 1, "one component");
    H::check(countComponents(3, {}), 3, "no edges");
