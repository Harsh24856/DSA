// shortest number of edges from 0 to n - 1, or -1
int solve(int n, vector<pair<int, int>> edges) {
    vector<vector<int>> adj(n);
    for (auto [u, v] : edges) { adj[u].push_back(v); adj[v].push_back(u); }
    vector<int> dist(n, -1);
    queue<int> q; q.push(0); dist[0] = 0;
    while (!q.empty()) {
        int u = q.front(); q.pop();
        for (int v : adj[u]) if (dist[v] < 0) { dist[v] = dist[u] + 1; q.push(v); }
    }
    return dist[n - 1];
}
