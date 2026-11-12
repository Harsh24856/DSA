class Solution {
    vector<vector<int>> adj;
    vector<int> xr, tin, tout;
    int t = 0;
    void dfs(int u, int p) {
        tin[u] = t++;
        for (int v : adj[u])
            if (v != p) {
                dfs(v, u);
                xr[u] ^= xr[v];         // xor of the whole subtree
            }
        tout[u] = t;
    }
    bool anc(int a, int b) { return tin[a] <= tin[b] && tin[b] < tout[a]; }   // a is above b
public:
    int minimumScore(vector<int>& nums, vector<vector<int>>& edges) {
        int n = nums.size();
        adj.assign(n, {});
        for (auto& e : edges) {
            adj[e[0]].push_back(e[1]);
            adj[e[1]].push_back(e[0]);
        }
        xr = nums;
        tin.assign(n, 0);
        tout.assign(n, 0);
        dfs(0, -1);
        int total = xr[0], best = INT_MAX;
        // cut the edges above nodes i and j
        for (int i = 1; i < n; i++)
            for (int j = i + 1; j < n; j++) {
                int a, b, c;
                if (anc(i, j)) { a = xr[j]; b = xr[i] ^ xr[j]; c = total ^ xr[i]; }
                else if (anc(j, i)) { a = xr[i]; b = xr[j] ^ xr[i]; c = total ^ xr[j]; }
                else { a = xr[i]; b = xr[j]; c = total ^ xr[i] ^ xr[j]; }
                best = min(best, max({a, b, c}) - min({a, b, c}));
            }
        return best;
    }
};
