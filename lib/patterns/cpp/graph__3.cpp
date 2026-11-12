// Kahn: repeatedly take a node with no remaining prerequisites
vector<int> topo(int n, const vector<vector<int>>& edges) {   // edge {a, b} means a before b
    vector<vector<int>> adj(n);
    vector<int> indeg(n, 0);
    for (auto& e : edges) { adj[e[0]].push_back(e[1]); indeg[e[1]]++; }
    queue<int> q;
    for (int i = 0; i < n; i++) if (!indeg[i]) q.push(i);
    vector<int> order;
    while (!q.empty()) {
        int u = q.front(); q.pop();
        order.push_back(u);
        for (int v : adj[u]) if (--indeg[v] == 0) q.push(v);
    }
    return (int)order.size() == n ? order : vector<int>{};    // short means a cycle
}
// @test
    H::check(topo(4, {{0, 1}, {0, 2}, {1, 3}, {2, 3}}), vector<int>{0, 1, 2, 3}, "topo order");
    H::check(topo(2, {{0, 1}, {1, 0}}), vector<int>{}, "cycle");
    H::check(topo(3, {}), vector<int>{0, 1, 2}, "no edges");
