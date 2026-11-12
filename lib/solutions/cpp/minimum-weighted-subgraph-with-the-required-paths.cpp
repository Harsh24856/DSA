class Solution {
    using Graph = vector<vector<pair<int, int>>>;
    static constexpr long long INF = LLONG_MAX / 4;
    vector<long long> dijkstra(int src, const Graph& adj) {
        vector<long long> dist(adj.size(), INF);
        dist[src] = 0;
        priority_queue<pair<long long, int>, vector<pair<long long, int>>, greater<>> heap;
        heap.push({0, src});
        while (!heap.empty()) {
            auto [d, u] = heap.top();
            heap.pop();
            if (d > dist[u]) continue;
            for (auto [v, w] : adj[u])
                if (d + w < dist[v]) {
                    dist[v] = d + w;
                    heap.push({dist[v], v});
                }
        }
        return dist;
    }
public:
    long long minimumWeight(int n, vector<vector<int>>& edges, int src1, int src2, int dest) {
        Graph fwd(n), rev(n);
        for (auto& e : edges) {
            fwd[e[0]].push_back({e[1], e[2]});
            rev[e[1]].push_back({e[0], e[2]});
        }
        auto a = dijkstra(src1, fwd), b = dijkstra(src2, fwd), c = dijkstra(dest, rev);
        long long best = INF;
        for (int i = 0; i < n; i++) best = min(best, a[i] + b[i] + c[i]);   // the paths meet at i
        return best >= INF ? -1 : best;
    }
};
