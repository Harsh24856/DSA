class Solution {
public:
    int countCompleteComponents(int n, vector<vector<int>>& edges) {
        vector<vector<int>> g(n);
        for (auto& e : edges) {
            g[e[0]].push_back(e[1]);
            g[e[1]].push_back(e[0]);
        }
        vector<bool> seen(n, false);
        int ans = 0;
        for (int s = 0; s < n; s++) {
            if (seen[s]) continue;
            seen[s] = true;
            vector<int> comp, stack{s};
            while (!stack.empty()) {
                int u = stack.back();
                stack.pop_back();
                comp.push_back(u);
                for (int v : g[u])
                    if (!seen[v]) {
                        seen[v] = true;
                        stack.push_back(v);
                    }
            }
            // complete: every node links to all the others
            if (all_of(comp.begin(), comp.end(), [&](int u) { return g[u].size() == comp.size() - 1; })) ans++;
        }
        return ans;
    }
};
