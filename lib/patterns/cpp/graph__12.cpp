// Kosaraju: finish order on the graph, then DFS on the reversed graph latest-finish first
pair<vector<int>, int> scc(int n, const vector<vector<int>>& edges) {
    vector<vector<int>> adj(n), radj(n);
    for (auto& e : edges) { adj[e[0]].push_back(e[1]); radj[e[1]].push_back(e[0]); }
    vector<bool> seen(n, false);
    vector<int> order;
    function<void(int)> dfs1 = [&](int u) {
        seen[u] = true;
        for (int v : adj[u]) if (!seen[v]) dfs1(v);
        order.push_back(u);                              // u is finished
    };
    for (int u = 0; u < n; u++) if (!seen[u]) dfs1(u);
    vector<int> comp(n, -1);
    int c = 0;
    function<void(int)> dfs2 = [&](int u) {
        comp[u] = c;
        for (int v : radj[u]) if (comp[v] < 0) dfs2(v);
    };
    for (int k = n - 1; k >= 0; k--)
        if (comp[order[k]] < 0) { dfs2(order[k]); c++; }
    return {comp, c};
}
// @test
    auto [comp, c] = scc(6, {{0, 1}, {1, 2}, {2, 0}, {1, 3}, {3, 4}, {4, 5}, {5, 3}});
    H::check(c, 2, "two sccs");
    H::check(comp[0] == comp[2] && comp[3] == comp[5] && comp[0] != comp[3], true, "members");
    auto [comp2, c2] = scc(4, {{0, 1}, {1, 2}, {2, 3}});
    H::check(c2, 4, "dag: every node alone");
    H::check(comp2, vector<int>{0, 1, 2, 3}, "source component first");
