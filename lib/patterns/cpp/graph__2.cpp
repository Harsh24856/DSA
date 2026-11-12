// BFS: the first time a node is reached, it is by the fewest edges
int shortest(const vector<vector<int>>& adj, int src, int dst) {
    vector<int> dist(adj.size(), -1);
    dist[src] = 0;
    queue<int> q;
    q.push(src);
    while (!q.empty()) {
        int u = q.front(); q.pop();
        if (u == dst) return dist[u];
        for (int v : adj[u])
            if (dist[v] < 0) { dist[v] = dist[u] + 1; q.push(v); }   // mark when pushing
    }
    return -1;
}
// @test
    vector<vector<int>> adj = {{1, 2}, {0, 3, 4}, {0, 4}, {1, 5}, {1, 2, 5}, {3, 4}, {}};
    H::check(shortest(adj, 0, 5), 3, "bfs distance");
    H::check(shortest(adj, 0, 0), 0, "source is target");
    H::check(shortest(adj, 0, 6), -1, "unreachable");
