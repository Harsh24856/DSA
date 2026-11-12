// 2-colour with BFS; a neighbour with the same colour means an odd cycle
bool isBipartite(const vector<vector<int>>& adj) {
    int n = adj.size();
    vector<int> color(n, -1);
    for (int s = 0; s < n; s++) {
        if (color[s] >= 0) continue;                   // every component separately
        color[s] = 0;
        queue<int> q;
        q.push(s);
        while (!q.empty()) {
            int u = q.front(); q.pop();
            for (int v : adj[u]) {
                if (color[v] < 0) { color[v] = 1 - color[u]; q.push(v); }
                else if (color[v] == color[u]) return false;
            }
        }
    }
    return true;
}
// @test
    H::check(isBipartite({{1, 3}, {0, 2}, {1, 3}, {0, 2}}), true, "square");
    H::check(isBipartite({{1, 2, 3}, {0, 2}, {0, 1, 3}, {0, 2}}), false, "triangle inside");
    H::check(isBipartite({{}, {2}, {1}, {4, 5}, {3, 5}, {3, 4}}), false, "odd cycle in second component");
