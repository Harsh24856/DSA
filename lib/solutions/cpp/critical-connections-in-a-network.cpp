class Solution {
    vector<vector<int>> g, out;
    vector<int> tin, low;
    int t = 0;

    void dfs(int u, int parent) {
        tin[u] = low[u] = t++;
        for (int v : g[u]) {
            if (v == parent) continue;
            if (tin[v] == -1) {
                dfs(v, u);
                low[u] = min(low[u], low[v]);
                if (low[v] > tin[u]) out.push_back({u, v});   // v cannot reach u or above without this edge
            } else {
                low[u] = min(low[u], tin[v]);
            }
        }
    }

public:
    vector<vector<int>> criticalConnections(int n, vector<vector<int>>& connections) {
        g.assign(n, {});
        for (auto& c : connections) {
            g[c[0]].push_back(c[1]);
            g[c[1]].push_back(c[0]);
        }
        tin.assign(n, -1);
        low.assign(n, 0);
        dfs(0, -1);
        return out;
    }
};
// @test
    auto norm = [](vector<vector<int>> v) { for (auto& e : v) sort(e.begin(), e.end()); sort(v.begin(), v.end()); return v; };
    vector<vector<int>> a{{0, 1}, {1, 2}, {2, 0}, {1, 3}}, b{{0, 1}}, c{{0, 1}, {1, 2}, {2, 0}};
    H::check(norm(Solution().criticalConnections(4, a)), vector<vector<int>>{{1, 3}}, "a");
    H::check(norm(Solution().criticalConnections(2, b)), vector<vector<int>>{{0, 1}}, "b");
    H::check(norm(Solution().criticalConnections(3, c)), vector<vector<int>>{}, "c");
