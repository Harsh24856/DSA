class Solution {
public:
    int minReorder(int n, vector<vector<int>>& connections) {
        vector<vector<pair<int, int>>> adj(n);
        for (auto& e : connections) {
            adj[e[0]].push_back({e[1], 1});   // walking it as given goes away from 0: flip
            adj[e[1]].push_back({e[0], 0});
        }
        vector<bool> seen(n, false);
        seen[0] = true;
        vector<int> st{0};
        int flips = 0;
        while (!st.empty()) {
            int u = st.back(); st.pop_back();
            for (auto [v, cost] : adj[u])
                if (!seen[v]) { seen[v] = true; flips += cost; st.push_back(v); }
        }
        return flips;
    }
};
