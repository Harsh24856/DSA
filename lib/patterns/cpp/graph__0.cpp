// Adjacency list graph: adj[u] maps each neighbour v to the edge weight
struct Graph {
    int n, m = 0;                                     // vertices, edges
    bool directed;
    vector<unordered_map<int, long long>> adj;
    Graph(int n, bool directed = false) : n(n), directed(directed), adj(n) {}

    int addVertex() { adj.emplace_back(); return n++; }
    void addEdge(int u, int v, long long w = 1) {
        if (!adj[u].count(v)) m++;
        adj[u][v] = w;
        if (!directed) adj[v][u] = w;                 // undirected: store both directions
    }
    void removeEdge(int u, int v) {
        if (adj[u].erase(v)) { m--; if (!directed) adj[v].erase(u); }
    }
    bool hasEdge(int u, int v) const { return adj[u].count(v) > 0; }
    int degree(int u) const { return adj[u].size(); }   // out-degree when directed

    vector<int> bfs(int s) const {                    // fewest edges from s, -1 if unreachable
        vector<int> dist(n, -1);
        dist[s] = 0;
        queue<int> q; q.push(s);
        while (!q.empty()) {
            int u = q.front(); q.pop();
            for (auto& [v, w] : adj[u])
                if (dist[v] == -1) { dist[v] = dist[u] + 1; q.push(v); }   // mark when pushed
        }
        return dist;
    }
    vector<int> dfs(int s) const {                    // order of first visit, smallest neighbour first
        vector<int> order; vector<bool> seen(n, false);
        vector<int> st{s};
        while (!st.empty()) {
            int u = st.back(); st.pop_back();
            if (seen[u]) continue;
            seen[u] = true; order.push_back(u);
            vector<int> nb;
            for (auto& [v, w] : adj[u]) if (!seen[v]) nb.push_back(v);
            sort(nb.rbegin(), nb.rend());
            for (int v : nb) st.push_back(v);
        }
        return order;
    }
    int components(vector<int>& comp) const {
        comp.assign(n, -1);
        int k = 0;
        for (int s = 0; s < n; s++)
            if (comp[s] == -1) { for (int u : dfs(s)) comp[u] = k; k++; }
        return k;
    }
    optional<vector<int>> topoOrder() const {         // Kahn; nullopt when there is a cycle
        vector<int> indeg(n, 0), order;
        for (int u = 0; u < n; u++) for (auto& [v, w] : adj[u]) indeg[v]++;
        queue<int> q;
        for (int u = 0; u < n; u++) if (!indeg[u]) q.push(u);
        while (!q.empty()) {
            int u = q.front(); q.pop(); order.push_back(u);
            for (auto& [v, w] : adj[u]) if (--indeg[v] == 0) q.push(v);
        }
        if ((int)order.size() != n) return nullopt;
        return order;
    }
    vector<long long> dijkstra(int s) const {         // non-negative weights
        vector<long long> dist(n, LLONG_MAX);
        dist[s] = 0;
        priority_queue<pair<long long, int>, vector<pair<long long, int>>, greater<>> pq;
        pq.push({0, s});
        while (!pq.empty()) {
            auto [d, u] = pq.top(); pq.pop();
            if (d > dist[u]) continue;                // stale entry
            for (auto& [v, w] : adj[u])
                if (d + w < dist[v]) { dist[v] = d + w; pq.push({dist[v], v}); }
        }
        return dist;
    }
};

// the same graph as an adjacency matrix: O(V^2) memory, O(1) edge test
vector<vector<long long>> matrixOf(const Graph& g) {
    vector<vector<long long>> mat(g.n, vector<long long>(g.n, 0));
    for (int u = 0; u < g.n; u++) for (auto& [v, w] : g.adj[u]) mat[u][v] = w;
    return mat;
}
// @test
    Graph g(6);
    for (auto [u, v] : vector<pair<int, int>>{{0, 1}, {0, 2}, {1, 3}, {2, 4}, {3, 5}, {4, 5}, {1, 4}}) g.addEdge(u, v);
    H::check(g.m, 7, "edge count");
    H::check(g.hasEdge(4, 1), true, "undirected edge both ways");
    H::check(g.degree(1), 3, "degree");
    H::check(g.bfs(0), vector<int>{0, 1, 1, 2, 2, 3}, "bfs distances");
    H::check(g.dfs(0), vector<int>{0, 1, 3, 5, 4, 2}, "dfs order");
    g.removeEdge(1, 4);
    H::check(g.hasEdge(1, 4) || g.hasEdge(4, 1), false, "remove edge");
    H::check(g.m, 6, "edge count after remove");
    H::check(g.addVertex(), 6, "add vertex");
    vector<int> comp;
    H::check(g.components(comp), 2, "components");
    H::check(comp, vector<int>{0, 0, 0, 0, 0, 0, 1}, "component ids");
    H::check(matrixOf(g)[0], vector<long long>{0, 1, 1, 0, 0, 0, 0}, "matrix row");
    Graph d(5, true);
    for (auto [u, v] : vector<pair<int, int>>{{0, 1}, {0, 2}, {1, 4}, {2, 3}, {3, 4}}) d.addEdge(u, v);
    vector<int> order = d.topoOrder().value(), pos(5);
    for (int i = 0; i < 5; i++) pos[order[i]] = i;
    bool forward = true;
    for (int u = 0; u < 5; u++) for (auto& [v, w] : d.adj[u]) forward = forward && pos[u] < pos[v];
    H::check(forward, true, "topological order: every edge points forward");
    d.addEdge(4, 0);
    H::check(d.topoOrder().has_value(), false, "cycle has no order");
    Graph w(4);
    for (auto [u, v, c] : vector<tuple<int, int, int>>{{0, 1, 4}, {0, 2, 1}, {2, 1, 2}, {1, 3, 1}}) w.addEdge(u, v, c);
    H::check(w.dijkstra(0), vector<long long>{0, 3, 1, 4}, "dijkstra");
