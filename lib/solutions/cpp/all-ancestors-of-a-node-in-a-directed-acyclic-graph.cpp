class Solution {
public:
    vector<vector<int>> getAncestors(int n, vector<vector<int>>& edges) {
        vector<vector<int>> g(n), anc(n);
        for (auto& e : edges) g[e[0]].push_back(e[1]);
        for (int s = 0; s < n; s++) {      // s is an ancestor of everything it reaches
            vector<bool> seen(n, false);
            vector<int> stack{s};
            seen[s] = true;
            while (!stack.empty()) {
                int u = stack.back();
                stack.pop_back();
                for (int v : g[u])
                    if (!seen[v]) {
                        seen[v] = true;
                        anc[v].push_back(s);   // s goes up in order, so lists stay sorted
                        stack.push_back(v);
                    }
            }
        }
        return anc;
    }
};
