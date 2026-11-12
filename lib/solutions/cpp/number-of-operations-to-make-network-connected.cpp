class Solution {
public:
    int makeConnected(int n, vector<vector<int>>& connections) {
        if ((int)connections.size() < n - 1) return -1;   // not enough cables
        vector<int> parent(n);
        iota(parent.begin(), parent.end(), 0);
        auto find = [&](int x) {
            while (parent[x] != x) { parent[x] = parent[parent[x]]; x = parent[x]; }   // path halving
            return x;
        };
        int comps = n;
        for (auto& c : connections) {
            int ra = find(c[0]), rb = find(c[1]);
            if (ra != rb) { parent[ra] = rb; comps--; }
        }
        return comps - 1;   // one cable joins two components
    }
};
