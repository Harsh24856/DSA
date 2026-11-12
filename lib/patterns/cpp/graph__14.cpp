// Hierholzer, directed: start where out - in = 1, walk unused edges, write a node when it is stuck, reverse
template <class T>
vector<T> eulerDirected(const vector<pair<T, T>>& edges) {
    if (edges.empty()) return {};
    map<T, vector<T>> adj;
    map<T, int> bal;                                           // out - in
    for (auto& [u, v] : edges) { adj[u].push_back(v); bal[u]++; bal[v]--; }
    for (auto& [u, vs] : adj) sort(vs.rbegin(), vs.rend());   // pop_back then takes the smallest
    int starts = 0;
    T start = adj.begin()->first;
    for (auto& [u, b] : bal) {
        if (abs(b) > 1) return {};
        if (b == 1) { starts++; start = u; }
    }
    if (starts > 1) return {};
    vector<T> stack{start}, path;
    while (!stack.empty()) {
        auto& out = adj[stack.back()];
        if (!out.empty()) { T v = out.back(); out.pop_back(); stack.push_back(v); }  // walk an unused edge
        else { path.push_back(stack.back()); stack.pop_back(); }                       // stuck: final here
    }
    reverse(path.begin(), path.end());
    return path.size() == edges.size() + 1 ? path : vector<T>{};  // else not connected
}

// Hierholzer, undirected: nodes 0..n-1, start at an odd-degree node if there is one
vector<int> eulerUndirected(int n, const vector<pair<int, int>>& edges) {
    if (edges.empty()) return {};
    vector<vector<pair<int, int>>> adj(n);
    vector<int> deg(n, 0);
    for (int i = 0; i < (int)edges.size(); i++) {
        auto [u, v] = edges[i];
        adj[u].push_back({v, i}); adj[v].push_back({u, i}); deg[u]++; deg[v]++;
    }
    vector<int> odd;
    for (int u = 0; u < n; u++) if (deg[u] % 2) odd.push_back(u);
    if (odd.size() != 0 && odd.size() != 2) return {};
    int start = odd.empty() ? edges[0].first : odd[0];
    vector<bool> used(edges.size(), false);
    vector<int> stack{start}, path;
    while (!stack.empty()) {
        auto& out = adj[stack.back()];
        while (!out.empty() && used[out.back().second]) out.pop_back();  // used from the other end
        if (!out.empty()) { auto [v, i] = out.back(); out.pop_back(); used[i] = true; stack.push_back(v); }
        else { path.push_back(stack.back()); stack.pop_back(); }
    }
    reverse(path.begin(), path.end());
    return path.size() == edges.size() + 1 ? path : vector<int>{};
}
// @test
    H::check(eulerDirected<string>({{"JFK", "SFO"}, {"JFK", "ATL"}, {"SFO", "ATL"}, {"ATL", "JFK"}, {"ATL", "SFO"}}),
             vector<string>{"JFK", "ATL", "JFK", "SFO", "ATL", "SFO"}, "itinerary");
    H::check(eulerDirected<string>({{"JFK", "KUL"}, {"JFK", "NRT"}, {"NRT", "JFK"}}), vector<string>{"JFK", "NRT", "JFK", "KUL"}, "dead end last");
    H::check(eulerDirected<int>({{5, 1}, {4, 5}, {11, 9}, {9, 4}}), vector<int>{11, 9, 4, 5, 1}, "valid arrangement");
    H::check(eulerDirected<int>({{1, 3}, {3, 2}, {2, 1}}), vector<int>{1, 3, 2, 1}, "circuit");
    H::check(eulerDirected<int>({{0, 1}, {2, 3}}), vector<int>{}, "not connected");
    H::check(eulerDirected<int>({{0, 1}, {0, 2}}), vector<int>{}, "two starts");
    H::check(eulerDirected<int>({{0, 1}, {1, 2}, {2, 3}, {3, 1}, {1, 4}}), vector<int>{0, 1, 2, 3, 1, 4}, "detour spliced in");
    H::check(eulerUndirected(5, {{0, 1}, {1, 2}, {2, 0}, {0, 3}, {3, 4}, {4, 0}}), vector<int>{0, 4, 3, 0, 2, 1, 0}, "undirected circuit");
    H::check(eulerUndirected(4, {{0, 1}, {1, 2}, {2, 3}}), vector<int>{0, 1, 2, 3}, "undirected path");
    H::check(eulerUndirected(4, {{0, 1}, {0, 2}, {0, 3}}), vector<int>{}, "four odd nodes");
