class Solution {
    vector<int> state;                                   // 0 unseen, 1 on the path, 2 safe

    bool safe(vector<vector<int>>& graph, int u) {
        if (state[u]) return state[u] == 2;
        state[u] = 1;
        bool ok = true;
        for (int v : graph[u]) if (!safe(graph, v)) { ok = false; break; }
        if (ok) state[u] = 2;
        return state[u] == 2;
    }

public:
    vector<int> eventualSafeNodes(vector<vector<int>>& graph) {
        state.assign(graph.size(), 0);
        vector<int> out;
        for (int u = 0; u < (int)graph.size(); u++) if (safe(graph, u)) out.push_back(u);
        return out;
    }
};
