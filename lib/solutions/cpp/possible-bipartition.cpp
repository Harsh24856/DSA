class Solution {
public:
    bool possibleBipartition(int n, vector<vector<int>>& dislikes) {
        vector<vector<int>> g(n + 1);
        for (auto& d : dislikes) { g[d[0]].push_back(d[1]); g[d[1]].push_back(d[0]); }
        vector<int> color(n + 1, 0);                   // 0 unseen, 1 or -1 the two groups
        for (int s = 1; s <= n; s++) {
            if (color[s]) continue;
            color[s] = 1;
            queue<int> q;
            q.push(s);
            while (!q.empty()) {
                int u = q.front(); q.pop();
                for (int v : g[u]) {
                    if (color[v] == color[u]) return false;   // two people who dislike each other, same group
                    if (!color[v]) { color[v] = -color[u]; q.push(v); }
                }
            }
        }
        return true;
    }
};
