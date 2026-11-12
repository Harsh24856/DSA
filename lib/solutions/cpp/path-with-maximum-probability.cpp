class Solution {
public:
    double maxProbability(int n, vector<vector<int>>& edges, vector<double>& succProb, int start_node, int end_node) {
        vector<vector<pair<int, double>>> adj(n);
        for (size_t i = 0; i < edges.size(); i++) {
            adj[edges[i][0]].push_back({edges[i][1], succProb[i]});
            adj[edges[i][1]].push_back({edges[i][0], succProb[i]});
        }
        vector<double> best(n, 0.0);
        best[start_node] = 1.0;
        priority_queue<pair<double, int>> heap;          // max-heap on probability
        heap.push({1.0, start_node});
        while (!heap.empty()) {
            auto [p, u] = heap.top(); heap.pop();
            if (u == end_node) return p;
            if (p < best[u]) continue;                   // stale entry
            for (auto [v, q] : adj[u])
                if (p * q > best[v]) { best[v] = p * q; heap.push({best[v], v}); }
        }
        return 0.0;
    }
};
