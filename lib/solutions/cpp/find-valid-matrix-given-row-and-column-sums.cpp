class Solution {
public:
    vector<vector<int>> restoreMatrix(vector<int>& rowSum, vector<int>& colSum) {
        vector<vector<int>> out(rowSum.size(), vector<int>(colSum.size(), 0));
        for (size_t i = 0; i < rowSum.size(); i++)
            for (size_t j = 0; j < colSum.size(); j++) {
                int v = min(rowSum[i], colSum[j]);   // put as much as both allow
                out[i][j] = v;
                rowSum[i] -= v;
                colSum[j] -= v;
            }
        return out;
    }
};
// @test
    for (auto [rs, cs] : vector<pair<vector<int>, vector<int>>>{{{3, 8}, {4, 7}}, {{5, 7, 10}, {8, 6, 8}}}) {
        vector<int> r = rs, c = cs;
        auto m = Solution().restoreMatrix(r, c);
        vector<int> gr(m.size(), 0), gc(m[0].size(), 0);
        bool nonneg = true;
        for (size_t i = 0; i < m.size(); i++)
            for (size_t j = 0; j < m[0].size(); j++) { gr[i] += m[i][j]; gc[j] += m[i][j]; nonneg &= m[i][j] >= 0; }
        H::check(gr, rs, "restoreMatrix rows");
        H::check(gc, cs, "restoreMatrix cols");
        H::check(nonneg, true, "restoreMatrix nonnegative");
    }
