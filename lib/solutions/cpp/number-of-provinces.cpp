class Solution {
public:
    int findCircleNum(vector<vector<int>>& isConnected) {
        int n = isConnected.size();
        vector<bool> seen(n, false);
        function<void(int)> dfs = [&](int u) {
            seen[u] = true;
            for (int v = 0; v < n; v++)
                if (isConnected[u][v] && !seen[v]) dfs(v);
        };
        int provinces = 0;
        for (int u = 0; u < n; u++)
            if (!seen[u]) {   // a new city starts a new province
                provinces++;
                dfs(u);
            }
        return provinces;
    }
};
