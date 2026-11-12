class Solution {
public:
    vector<int> findDiagonalOrder(vector<vector<int>>& mat) {
        int m = mat.size(), n = mat[0].size();
        vector<int> out;
        for (int d = 0; d < m + n - 1; d++) {
            vector<int> diag;                              // cells with i + j == d, top to bottom
            for (int i = max(0, d - n + 1); i <= min(d, m - 1); i++) diag.push_back(mat[i][d - i]);
            if (d % 2 == 0) reverse(diag.begin(), diag.end());   // even diagonals go up
            out.insert(out.end(), diag.begin(), diag.end());
        }
        return out;
    }
};
