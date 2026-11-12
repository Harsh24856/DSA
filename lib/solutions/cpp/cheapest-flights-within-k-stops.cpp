class Solution {
public:
    int findCheapestPrice(int n, vector<vector<int>>& flights, int src, int dst, int k) {
        const int INF = INT_MAX;
        vector<int> cost(n, INF);
        cost[src] = 0;
        for (int round = 0; round <= k; round++) {       // k stops means at most k + 1 flights
            vector<int> nxt = cost;                      // relax from last round's costs only
            for (auto& f : flights) {
                int u = f[0], v = f[1], w = f[2];
                if (cost[u] != INF && cost[u] + w < nxt[v]) nxt[v] = cost[u] + w;
            }
            cost = nxt;
        }
        return cost[dst] == INF ? -1 : cost[dst];
    }
};
