// disjoint sets: path halving + union by size, near O(1) per call
struct DSU {
    vector<int> p, size;
    explicit DSU(int n) : p(n), size(n, 1) { iota(p.begin(), p.end(), 0); }
    int find(int x) {
        while (p[x] != x) { p[x] = p[p[x]]; x = p[x]; }   // path halving
        return x;
    }
    bool unite(int a, int b) {                          // false if already connected
        a = find(a); b = find(b);
        if (a == b) return false;
        if (size[a] < size[b]) swap(a, b);
        p[b] = a; size[a] += size[b];
        return true;
    }
};
// @test
    DSU d(5);
    H::check(d.unite(0, 1), true, "union");
    H::check(d.unite(1, 2), true, "union 2");
    H::check(d.unite(0, 2), false, "same set");
    H::check(d.find(2) == d.find(0), true, "connected");
    H::check(d.find(3) == d.find(0), false, "separate");
    H::check(d.size[d.find(0)], 3, "set size");
