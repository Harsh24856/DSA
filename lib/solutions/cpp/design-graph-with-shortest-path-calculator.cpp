class Graph {
    vector<vector<pair<int, int>>> g;   // node -> (neighbour, weight)
public:
    Graph(int n, vector<vector<int>>& edges) : g(n) {
        for (auto& e : edges) addEdge(e);
    }

    void addEdge(vector<int> edge) {
        g[edge[0]].push_back({edge[1], edge[2]});
    }

    int shortestPath(int node1, int node2) {   // Dijkstra
        vector<int> dist(g.size(), INT_MAX);
        dist[node1] = 0;
        priority_queue<pair<int, int>, vector<pair<int, int>>, greater<>> h;
        h.push({0, node1});
        while (!h.empty()) {
            auto [d, u] = h.top(); h.pop();
            if (u == node2) return d;
            if (d > dist[u]) continue;       // stale entry
            for (auto [v, w] : g[u])
                if (d + w < dist[v]) { dist[v] = d + w; h.push({d + w, v}); }
        }
        return -1;
    }
};
// @test
    vector<vector<int>> edges{{0, 2, 5}, {0, 1, 2}, {1, 2, 1}, {3, 0, 3}};
    Graph gr(4, edges);
    H::check(gr.shortestPath(3, 2), 6, "Graph 3->2");
    H::check(gr.shortestPath(0, 3), -1, "Graph 0->3");
    gr.addEdge({1, 3, 4});
    H::check(gr.shortestPath(0, 3), 6, "Graph 0->3 after addEdge");
