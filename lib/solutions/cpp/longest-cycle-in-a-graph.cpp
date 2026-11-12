class Solution {
public:
    int longestCycle(vector<int>& edges) {
        int n = edges.size();
        vector<int> stamp(n, 0);   // time each node was first visited
        int t = 1, best = -1;
        for (int s = 0; s < n; s++) {
            if (stamp[s]) continue;
            int first = t, u = s;
            while (u != -1 && !stamp[u]) {
                stamp[u] = t++;
                u = edges[u];
            }
            if (u != -1 && stamp[u] >= first) best = max(best, t - stamp[u]);   // met this walk again
        }
        return best;
    }
};
