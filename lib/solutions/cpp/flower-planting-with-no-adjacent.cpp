class Solution {
public:
    vector<int> gardenNoAdj(int n, vector<vector<int>>& paths) {
        vector<vector<int>> adj(n);
        for (auto& p : paths) { adj[p[0] - 1].push_back(p[1] - 1); adj[p[1] - 1].push_back(p[0] - 1); }
        vector<int> ans(n, 0);
        for (int u = 0; u < n; u++) {
            bool taken[5] = {};
            for (int v : adj[u]) taken[ans[v]] = true;
            for (int c = 1; c <= 4; c++) if (!taken[c]) { ans[u] = c; break; }   // at most 3 neighbours, so one is free
        }
        return ans;
    }
};
