class Solution {
    vector<vector<int>> g;
    int count = 0;
    // sum of the part of u's subtree still attached to u
    long long dfs(int u, int parent, vector<int>& values, int k) {
        long long s = values[u];
        for (int v : g[u])
            if (v != parent) s += dfs(v, u, values, k);
        if (s % k == 0) {      // cut it off as its own component
            count++;
            return 0;
        }
        return s;
    }
public:
    int maxKDivisibleComponents(int n, vector<vector<int>>& edges, vector<int>& values, int k) {
        g.assign(n, {});
        for (auto& e : edges) {
            g[e[0]].push_back(e[1]);
            g[e[1]].push_back(e[0]);
        }
        dfs(0, -1, values, k);
        return count;
    }
};
