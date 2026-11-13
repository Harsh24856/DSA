class Solution {
public:
    int minFallingPathSum(vector<vector<int>>& matrix) {
        int n = matrix.size();
        vector<int> prev = matrix[0], cur(n);
        for (int r = 1; r < n; r++) {
            for (int c = 0; c < n; c++) {
                int best = prev[c];
                if (c > 0) best = min(best, prev[c - 1]);
                if (c < n - 1) best = min(best, prev[c + 1]);
                cur[c] = matrix[r][c] + best;
            }
            swap(prev, cur);
        }
        return *min_element(prev.begin(), prev.end());
    }
};
