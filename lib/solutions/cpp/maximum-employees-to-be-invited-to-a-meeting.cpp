class Solution {
public:
    int maximumInvitations(vector<int>& favorite) {
        int n = favorite.size();
        vector<int> indeg(n, 0), chain(n, 0);
        for (int f : favorite) indeg[f]++;
        queue<int> q;
        for (int i = 0; i < n; i++) if (!indeg[i]) q.push(i);
        while (!q.empty()) {                                 // peel the trees hanging into the cycles
            int u = q.front(); q.pop();
            int v = favorite[u];
            chain[v] = max(chain[v], chain[u] + 1);
            if (--indeg[v] == 0) q.push(v);
        }
        int big = 0, pairs = 0;
        for (int i = 0; i < n; i++) {
            if (!indeg[i]) continue;
            int len = 0;
            for (int j = i; indeg[j]; j = favorite[j]) { indeg[j] = 0; len++; }
            if (len == 2) pairs += 2 + chain[i] + chain[favorite[i]];
            else big = max(big, len);
        }
        return max(big, pairs);
    }
};
