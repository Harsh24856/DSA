class Solution {
public:
    int maxProductPath(vector<vector<int>>& grid) {
        int m = grid.size(), n = grid[0].size();
        // the largest and smallest product reaching each cell (a negative can flip them)
        vector<vector<long long>> hi(m, vector<long long>(n)), lo(m, vector<long long>(n));
        for (int r = 0; r < m; r++)
            for (int c = 0; c < n; c++) {
                long long v = grid[r][c];
                if (r == 0 && c == 0) {
                    hi[r][c] = lo[r][c] = v;
                    continue;
                }
                vector<long long> prev;
                if (r) prev.insert(prev.end(), {hi[r - 1][c], lo[r - 1][c]});
                if (c) prev.insert(prev.end(), {hi[r][c - 1], lo[r][c - 1]});
                long long a = LLONG_MIN, b = LLONG_MAX;
                for (long long p : prev) {
                    a = max(a, p * v);
                    b = min(b, p * v);
                }
                hi[r][c] = a;
                lo[r][c] = b;
            }
        long long best = hi[m - 1][n - 1];
        return best >= 0 ? best % 1000000007 : -1;
    }
};
