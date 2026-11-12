class Solution {
public:
    vector<int> minOperationsQueries(int n, vector<vector<int>>& edges, vector<vector<int>>& queries) {
        vector<vector<pair<int, int>>> g(n);
        for (auto& e : edges) { g[e[0]].push_back({e[1], e[2]}); g[e[1]].push_back({e[0], e[2]}); }
        int LOG = 1;
        while ((1 << LOG) <= n) LOG++;
        vector<vector<int>> up(LOG, vector<int>(n, 0));
        vector<int> depth(n, 0);
        vector<array<int, 27>> cnt(n);                       // cnt[v][w] = edges of weight w from the root to v
        cnt[0].fill(0);
        vector<bool> seen(n, false);
        seen[0] = true;
        vector<int> st = {0};
        while (!st.empty()) {
            int u = st.back(); st.pop_back();
            for (auto [v, w] : g[u])
                if (!seen[v]) {
                    seen[v] = true;
                    up[0][v] = u; depth[v] = depth[u] + 1;
                    cnt[v] = cnt[u]; cnt[v][w]++;
                    st.push_back(v);
                }
        }
        for (int j = 1; j < LOG; j++)
            for (int v = 0; v < n; v++) up[j][v] = up[j - 1][up[j - 1][v]];
        auto lca = [&](int a, int b) {
            if (depth[a] < depth[b]) swap(a, b);
            int d = depth[a] - depth[b];
            for (int j = 0; j < LOG; j++) if (d >> j & 1) a = up[j][a];
            if (a == b) return a;
            for (int j = LOG - 1; j >= 0; j--)
                if (up[j][a] != up[j][b]) { a = up[j][a]; b = up[j][b]; }
            return up[0][a];
        };
        vector<int> out;
        for (auto& q : queries) {
            int a = q[0], b = q[1], l = lca(a, b), total = 0, best = 0;
            for (int w = 1; w <= 26; w++) {
                int c = cnt[a][w] + cnt[b][w] - 2 * cnt[l][w];
                total += c; best = max(best, c);
            }
            out.push_back(total - best);
        }
        return out;
    }
};
