class Solution {
public:
    vector<vector<int>> validArrangement(vector<vector<int>>& pairs) {
        unordered_map<int, vector<int>> g;
        unordered_map<int, int> bal;                         // out-degree - in-degree
        for (auto& p : pairs) { g[p[0]].push_back(p[1]); bal[p[0]]++; bal[p[1]]--; }
        int start = pairs[0][0];
        for (auto& [x, b] : bal) if (b == 1) { start = x; break; }
        vector<int> path, st = {start};
        while (!st.empty()) {
            int u = st.back();
            if (!g[u].empty()) { st.push_back(g[u].back()); g[u].pop_back(); }
            else { path.push_back(u); st.pop_back(); }
        }
        reverse(path.begin(), path.end());
        vector<vector<int>> out;
        for (size_t i = 0; i + 1 < path.size(); i++) out.push_back({path[i], path[i + 1]});
        return out;
    }
};
// @test
    auto ok = [](vector<vector<int>> pairs, vector<vector<int>> got) {
        for (size_t i = 0; i + 1 < got.size(); i++) if (got[i][1] != got[i + 1][0]) return false;
        return H::sorted(pairs) == H::sorted(got);
    };
    vector<vector<vector<int>>> tests = {{{5, 1}, {4, 5}, {11, 9}, {9, 4}}, {{1, 3}, {3, 2}, {2, 1}}, {{1, 2}, {1, 3}, {2, 1}}, {{1, 2}, {2, 3}, {3, 1}, {1, 4}, {4, 5}}, {{7, 7}}};
    for (auto& t : tests) {
        vector<vector<int>> in = t;
        H::check(ok(t, Solution().validArrangement(in)), true, "validArrangement " + H::str(t));
    }
