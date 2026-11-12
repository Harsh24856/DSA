class Solution {
public:
    vector<int> shortestAlternatingPaths(int n, vector<vector<int>>& redEdges, vector<vector<int>>& blueEdges) {
        vector<vector<int>> adj[2] = {vector<vector<int>>(n), vector<vector<int>>(n)};   // 0 red, 1 blue
        for (auto& e : redEdges) adj[0][e[0]].push_back(e[1]);
        for (auto& e : blueEdges) adj[1][e[0]].push_back(e[1]);
        vector<int> ans(n, -1);
        vector<array<bool, 2>> seen(n, {false, false});  // (node, colour of the edge that got us here)
        seen[0] = {true, true};
        queue<tuple<int, int, int>> q;
        q.push({0, 0, 0}); q.push({0, 1, 0});
        while (!q.empty()) {
            auto [u, c, d] = q.front(); q.pop();
            if (ans[u] == -1) ans[u] = d;
            for (int v : adj[1 - c][u])                  // next edge must be the other colour
                if (!seen[v][1 - c]) { seen[v][1 - c] = true; q.push({v, 1 - c, d + 1}); }
        }
        return ans;
    }
};
