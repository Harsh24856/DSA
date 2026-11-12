class Solution {
public:
    int longestPath(vector<int>& parent, string s) {
        int n = parent.size();
        vector<vector<int>> kids(n);
        for (int i = 1; i < n; i++) kids[parent[i]].push_back(i);
        vector<int> order{0};                                    // BFS order, parents first
        for (size_t i = 0; i < order.size(); i++)
            for (int v : kids[order[i]]) order.push_back(v);
        vector<int> down(n, 1);
        int best = 1;
        for (int k = n - 1; k >= 0; k--) {
            int u = order[k], a = 0, b = 0;                      // two longest legs
            for (int v : kids[u]) {
                if (s[v] == s[u]) continue;
                if (down[v] > a) { b = a; a = down[v]; }
                else if (down[v] > b) b = down[v];
            }
            down[u] = 1 + a;
            best = max(best, 1 + a + b);
        }
        return best;
    }
};
