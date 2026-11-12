class Solution {
public:
    vector<vector<int>> queensAttacktheKing(vector<vector<int>>& queens, vector<int>& king) {
        set<pair<int, int>> qs;
        for (auto& q : queens) qs.insert({q[0], q[1]});
        vector<vector<int>> out;
        for (int dr = -1; dr <= 1; dr++)
            for (int dc = -1; dc <= 1; dc++) {
                if (dr == 0 && dc == 0) continue;
                int r = king[0] + dr, c = king[1] + dc;
                while (0 <= r && r < 8 && 0 <= c && c < 8) {
                    if (qs.count({r, c})) { out.push_back({r, c}); break; }   // first queen in this direction
                    r += dr; c += dc;
                }
            }
        return out;
    }
};
// @test
    vector<vector<int>> q1{{0,1},{1,0},{4,0},{0,4},{3,3},{2,4}}; vector<int> k1{0, 0};
    H::check(H::sorted(Solution().queensAttacktheKing(q1, k1)), vector<vector<int>>{{0,1},{1,0},{3,3}}, "queens a");
    vector<vector<int>> q2{{0,0},{1,1},{2,2},{3,4},{3,5},{4,4},{4,5}}; vector<int> k2{3, 3};
    H::check(H::sorted(Solution().queensAttacktheKing(q2, k2)), vector<vector<int>>{{2,2},{3,4},{4,4}}, "queens b");
