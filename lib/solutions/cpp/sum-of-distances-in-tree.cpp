class Solution {
public:
    vector<int> sumOfDistancesInTree(int n, vector<vector<int>>& edges) {
        vector<vector<int>> adj(n);
        for (auto& e : edges) {
            adj[e[0]].push_back(e[1]);
            adj[e[1]].push_back(e[0]);
        }
        vector<int> order{0}, parent(n, -1);       // BFS order from root 0
        for (size_t i = 0; i < order.size(); i++) {
            int u = order[i];
            for (int v : adj[u])
                if (v != parent[u]) {
                    parent[v] = u;
                    order.push_back(v);
                }
        }
        vector<int> count(n, 1), sub(n, 0);        // subtree size and distance sum inside it
        for (int i = n - 1; i >= 0; i--) {
            int u = order[i], p = parent[u];
            if (p >= 0) {
                count[p] += count[u];
                sub[p] += sub[u] + count[u];
            }
        }
        vector<int> ans(n, 0);
        ans[0] = sub[0];
        // moving the root to u: count[u] nodes get 1 closer, the rest 1 further
        for (int i = 1; i < n; i++) {
            int u = order[i];
            ans[u] = ans[parent[u]] - count[u] + (n - count[u]);
        }
        return ans;
    }
};
