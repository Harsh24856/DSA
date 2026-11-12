class Solution {
public:
    int minCostConnectPoints(vector<vector<int>>& points) {
        int n = points.size(), total = 0;
        vector<int> dist(n, INT_MAX);                    // cheapest edge from the tree to each point
        vector<bool> used(n, false);
        dist[0] = 0;
        for (int step = 0; step < n; step++) {
            int u = -1;
            for (int i = 0; i < n; i++)                  // closest point not yet in the tree
                if (!used[i] && (u == -1 || dist[i] < dist[u])) u = i;
            used[u] = true;
            total += dist[u];
            for (int v = 0; v < n; v++)
                if (!used[v]) {
                    int d = abs(points[u][0] - points[v][0]) + abs(points[u][1] - points[v][1]);
                    dist[v] = min(dist[v], d);
                }
        }
        return total;
    }
};
