class Solution {
public:
    bool isBipartite(vector<vector<int>>& graph) {
        vector<int> color(graph.size(), -1);
        for (int s = 0; s < (int)graph.size(); s++) {
            if (color[s] != -1) continue;
            color[s] = 0;
            vector<int> st = {s};
            while (!st.empty()) {
                int u = st.back(); st.pop_back();
                for (int v : graph[u]) {
                    if (color[v] == -1) { color[v] = color[u] ^ 1; st.push_back(v); }
                    else if (color[v] == color[u]) return false;   // an edge inside one side
                }
            }
        }
        return true;
    }
};
