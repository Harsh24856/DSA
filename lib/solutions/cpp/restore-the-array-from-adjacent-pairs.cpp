class Solution {
public:
    vector<int> restoreArray(vector<vector<int>>& adjacentPairs) {
        unordered_map<int, vector<int>> g;
        for (auto& p : adjacentPairs) { g[p[0]].push_back(p[1]); g[p[1]].push_back(p[0]); }
        int start = 0;
        for (auto& [x, nb] : g) if (nb.size() == 1) { start = x; break; }   // an end has one neighbour
        vector<int> out{start};
        optional<int> prev;
        while (out.size() < g.size()) {
            int cur = out.back();
            int nxt = g[cur][0] != prev ? g[cur][0] : g[cur].back();   // the neighbour we did not come from
            prev = cur;
            out.push_back(nxt);
        }
        return out;
    }
};
// @test
    vector<pair<vector<vector<int>>, vector<int>>> cases{{{{2, 1}, {3, 4}, {3, 2}}, {1, 2, 3, 4}}, {{{4, -2}, {1, 4}, {-3, 1}}, {-2, 4, 1, -3}}, {{{100000, -100000}}, {100000, -100000}}};
    for (auto& [pairs, exp] : cases) {
        vector<int> got = Solution().restoreArray(pairs);
        if (got != exp) reverse(got.begin(), got.end());
        H::check(got, exp, "restoreArray");
    }
