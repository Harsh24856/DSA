// up[j][v] = the 2^j-th ancestor of v, or -1 above the root
struct Lifting {
    int LOG;
    vector<vector<int>> up;
    vector<int> depth;

    explicit Lifting(const vector<int>& parent) {        // parent[root] = -1
        int n = parent.size();
        LOG = max(1, (int)bit_width((unsigned)n));
        up.assign(LOG, parent);
        for (int j = 1; j < LOG; j++)
            for (int v = 0; v < n; v++) up[j][v] = up[j - 1][v] < 0 ? -1 : up[j - 1][up[j - 1][v]];
        vector<vector<int>> kids(n);
        int root = 0;
        for (int v = 0; v < n; v++) {
            if (parent[v] < 0) root = v;
            else kids[parent[v]].push_back(v);
        }
        depth.assign(n, 0);
        vector<int> order{root};
        for (size_t k = 0; k < order.size(); k++)
            for (int v : kids[order[k]]) { depth[v] = depth[order[k]] + 1; order.push_back(v); }
    }

    int kth(int v, int k) const {                         // jump once per set bit of k
        if (k >= (int)depth.size()) return -1;
        for (int j = 0; j < LOG && v >= 0; j++)
            if (k >> j & 1) v = up[j][v];
        return v;
    }

    int lca(int a, int b) const {
        if (depth[a] < depth[b]) swap(a, b);
        a = kth(a, depth[a] - depth[b]);
        if (a == b) return a;
        for (int j = LOG - 1; j >= 0; j--)
            if (up[j][a] != up[j][b]) { a = up[j][a]; b = up[j][b]; }   // still below the LCA
        return up[0][a];
    }
};
// @test
    Lifting t({-1, 0, 0, 1, 1, 2, 2});
    H::check(t.kth(3, 1), 1, "kth 1");
    H::check(t.kth(5, 2), 0, "kth 2");
    H::check(t.kth(6, 3), -1, "kth beyond root");
    Lifting d({-1, 0, 0, 1, 1, 2, 3, 3, 6, 8});
    H::check(d.lca(9, 5), 0, "lca across root");
    H::check(d.lca(9, 7), 3, "lca deep");
    H::check(d.lca(9, 6), 6, "lca is ancestor");
    H::check(d.lca(4, 4), 4, "lca same node");
    Lifting r({2, 2, -1});
    H::check(r.lca(0, 1), 2, "root not 0");
