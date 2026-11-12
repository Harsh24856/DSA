// Dijkstra with a min-heap and lazy deletion; adj[u] = {(v, w)}, weights >= 0
vector<long long> dijkstra(const vector<vector<pair<int, int>>>& adj, int src) {
    const long long INF = LLONG_MAX;
    vector<long long> dist(adj.size(), INF);
    dist[src] = 0;
    priority_queue<pair<long long, int>, vector<pair<long long, int>>, greater<>> h;
    h.push({0, src});
    while (!h.empty()) {
        auto [d, u] = h.top(); h.pop();
        if (d > dist[u]) continue;                     // stale entry
        for (auto [v, w] : adj[u])
            if (d + w < dist[v]) { dist[v] = d + w; h.push({dist[v], v}); }
    }
    return dist;
}
// @test
    vector<vector<pair<int, int>>> adj = {{{1, 4}, {2, 1}}, {{3, 1}}, {{1, 2}, {3, 5}}, {}, {}};
    auto d = dijkstra(adj, 0);
    H::check(d[1], 3LL, "via cheaper path");
    H::check(d[3], 4LL, "two hops");
    H::check(d[4], LLONG_MAX, "unreachable");
    H::check(d[0], 0LL, "source");
