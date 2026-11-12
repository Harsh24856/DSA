class Solution {
public:
    vector<vector<int>> allPathsSourceTarget(vector<vector<int>>& graph) {
        vector<vector<int>> out;
        int target = graph.size() - 1;
        vector<int> path{0};
        function<void(int)> go = [&](int u) {
            if (u == target) { out.push_back(path); return; }
            for (int v : graph[u]) {
                path.push_back(v);
                go(v);
                path.pop_back();                           // the graph is a DAG, so no visited set
            }
        };
        go(0);
        return out;
    }
};
