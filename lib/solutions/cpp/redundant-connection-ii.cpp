class Solution {
public:
    vector<int> findRedundantDirectedConnection(vector<vector<int>>& edges) {
        int n = edges.size();
        vector<int> parent(n + 1, 0), cand1, cand2;
        for (auto& e : edges) {
            if (parent[e[1]]) {   // second parent: one of these two edges must go
                cand1 = {parent[e[1]], e[1]};
                cand2 = {e[0], e[1]};
            } else {
                parent[e[1]] = e[0];
            }
        }
        vector<int> uf(n + 1);
        iota(uf.begin(), uf.end(), 0);
        auto find = [&](int x) {
            while (uf[x] != x) {
                uf[x] = uf[uf[x]];
                x = uf[x];
            }
            return x;
        };
        for (auto& e : edges) {
            if (e == cand2) continue;   // try the tree without the later candidate
            int ru = find(e[0]), rv = find(e[1]);
            if (ru == rv) return cand1.empty() ? e : cand1;   // still a cycle
            uf[rv] = ru;
        }
        return cand2;
    }
};
