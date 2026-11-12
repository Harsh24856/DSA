// rerooting: pass 1 gets subtree size and distance sums, pass 2 moves the root one edge at a time
vector<int> sumOfDistances(int n, const vector<vector<int>>& edges) {
    vector<vector<int>> adj(n);
    for (auto& e : edges) { adj[e[0]].push_back(e[1]); adj[e[1]].push_back(e[0]); }
    vector<int> parent(n, -1), order{0};
    for (size_t k = 0; k < order.size(); k++) {          // BFS order: parents before children
        int u = order[k];
        for (int v : adj[u]) if (v != parent[u]) { parent[v] = u; order.push_back(v); }
    }
    vector<int> size(n, 1), ans(n, 0);
    for (int k = n - 1; k > 0; k--) {                    // pass 1: children before parents
        int u = order[k], p = parent[u];
        size[p] += size[u];
        ans[p] += ans[u] + size[u];
    }
    for (int k = 1; k < n; k++) {                        // pass 2: size[u] nodes get closer, the rest farther
        int u = order[k];
        ans[u] = ans[parent[u]] - size[u] + (n - size[u]);
    }
    return ans;
}
// @test
    H::check(sumOfDistances(6, {{0, 1}, {0, 2}, {2, 3}, {2, 4}, {2, 5}}), vector<int>{8, 12, 6, 10, 10, 10}, "sum of distances");
    H::check(sumOfDistances(1, {}), vector<int>{0}, "single node");
    H::check(sumOfDistances(2, {{1, 0}}), vector<int>{1, 1}, "two nodes");
    H::check(sumOfDistances(4, {{0, 1}, {1, 2}, {2, 3}}), vector<int>{6, 4, 4, 6}, "path");
