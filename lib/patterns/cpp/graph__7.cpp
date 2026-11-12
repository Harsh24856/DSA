struct DSU {
    vector<int> p;
    explicit DSU(int n) : p(n) { iota(p.begin(), p.end(), 0); }
    int find(int x) { while (p[x] != x) { p[x] = p[p[x]]; x = p[x]; } return x; }
    bool unite(int a, int b) { a = find(a); b = find(b); if (a == b) return false; p[b] = a; return true; }
};

// Kruskal: cheapest edges first, skip any that would close a cycle; edges are {w, a, b}
long long kruskal(int n, vector<array<int, 3>> edges) {
    sort(edges.begin(), edges.end());
    DSU dsu(n);
    long long total = 0;
    int used = 0;
    for (auto [w, a, b] : edges)
        if (dsu.unite(a, b)) {
            total += w;
            if (++used == n - 1) break;
        }
    return used == n - 1 ? total : -1;                 // -1: the graph is not connected
}
// @test
    H::check(kruskal(4, {{1, 0, 1}, {4, 1, 2}, {3, 0, 2}, {2, 2, 3}, {5, 1, 3}}), 6LL, "mst");
    H::check(kruskal(3, {{1, 0, 1}}), -1LL, "disconnected");
    H::check(kruskal(1, {}), 0LL, "single node");
