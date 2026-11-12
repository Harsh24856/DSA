// Bellman-Ford: round i makes every path of up to i edges correct; k limits the edges to k + 1
vector<long long> bellmanFord(int n, const vector<array<int, 3>>& edges, int src, int k = -1) {
    const long long INF = LLONG_MAX / 4;               // headroom: INF + w cannot overflow
    vector<long long> dist(n, INF);
    dist[src] = 0;
    int rounds = k < 0 ? n - 1 : k + 1;
    for (int r = 0; r < rounds; r++) {
        vector<long long> prev = dist;                 // relax from last round only
        bool changed = false;
        for (auto [u, v, w] : edges)
            if (prev[u] < INF && prev[u] + w < dist[v]) { dist[v] = prev[u] + w; changed = true; }
        if (!changed) break;
    }
    return dist;
}
// @test
    vector<array<int, 3>> e = {{0, 1, 4}, {0, 2, 5}, {2, 1, -3}, {1, 3, 2}, {3, 4, 1}, {2, 4, 6}};
    auto d = bellmanFord(5, e, 0);
    H::check(d[1], 2LL, "negative edge");
    H::check(d[4], 5LL, "longest chain");
    vector<array<int, 3>> f = {{0, 1, 100}, {1, 2, 100}, {2, 3, 100}, {0, 3, 500}, {1, 3, 600}};
    H::check(bellmanFord(4, f, 0, 1)[3], 500LL, "at most 1 stop");
    H::check(bellmanFord(4, f, 0, 2)[3], 300LL, "at most 2 stops");
