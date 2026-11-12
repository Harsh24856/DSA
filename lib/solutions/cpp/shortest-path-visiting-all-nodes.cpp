class Solution {
public:
    int shortestPathLength(vector<vector<int>>& graph) {
        int n = graph.size(), full = (1 << n) - 1;
        queue<tuple<int, int, int>> q;                   // (node, visited mask, distance)
        vector<vector<bool>> seen(n, vector<bool>(1 << n, false));
        for (int i = 0; i < n; i++) { q.push({i, 1 << i, 0}); seen[i][1 << i] = true; }   // start anywhere
        while (!q.empty()) {
            auto [u, mask, d] = q.front(); q.pop();
            if (mask == full) return d;
            for (int v : graph[u]) {
                int m2 = mask | 1 << v;
                if (!seen[v][m2]) { seen[v][m2] = true; q.push({v, m2, d + 1}); }
            }
        }
        return 0;
    }
};
