// number of groups after each link (union-find)
vector<int> solve(int n, vector<pair<int, int>> links) {
    vector<int> parent(n);
    iota(parent.begin(), parent.end(), 0);
    auto find = [&](int x) {
        while (parent[x] != x) { parent[x] = parent[parent[x]]; x = parent[x]; }   // path halving
        return x;
    };
    int groups = n;
    vector<int> out;
    for (auto [a, b] : links) {
        int ra = find(a), rb = find(b);
        if (ra != rb) { parent[ra] = rb; groups--; }
        out.push_back(groups);
    }
    return out;
}
