class Solution {
public:
    int networkDelayTime(vector<vector<int>>& times, int n, int k) {
        vector<vector<pair<int, int>>> adj(n + 1);
        for (auto& t : times) adj[t[0]].push_back({t[1], t[2]});
        vector<int> dist(n + 1, -1);                     // -1 means not settled yet
        priority_queue<pair<int, int>, vector<pair<int, int>>, greater<>> heap;
        heap.push({0, k});
        int settled = 0, last = 0;
        while (!heap.empty()) {
            auto [d, u] = heap.top(); heap.pop();
            if (dist[u] != -1) continue;                 // already reached by a shorter path
            dist[u] = d; settled++; last = max(last, d);
            for (auto [v, w] : adj[u]) if (dist[v] == -1) heap.push({d + w, v});
        }
        return settled == n ? last : -1;
    }
};
