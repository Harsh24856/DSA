class Solution {
public:
    int reachableNodes(int n, vector<vector<int>>& edges, vector<int>& restricted) {
        vector<vector<int>> g(n);
        for (auto& e : edges) { g[e[0]].push_back(e[1]); g[e[1]].push_back(e[0]); }
        vector<bool> seen(n, false);
        for (int r : restricted) seen[r] = true;           // restricted nodes act as walls
        seen[0] = true;
        vector<int> stack{0};
        int count = 0;
        while (!stack.empty()) {
            int u = stack.back(); stack.pop_back();
            count++;
            for (int v : g[u])
                if (!seen[v]) { seen[v] = true; stack.push_back(v); }
        }
        return count;
    }
};
