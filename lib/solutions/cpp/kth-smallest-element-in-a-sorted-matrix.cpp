class Solution {
public:
    int kthSmallest(vector<vector<int>>& matrix, int k) {
        int n = matrix.size();
        auto count = [&](int x) {   // how many values are <= x, walking a staircase
            int c = 0, j = n - 1;
            for (auto& row : matrix) {
                while (j >= 0 && row[j] > x) j--;
                c += j + 1;
            }
            return c;
        };
        int lo = matrix[0][0], hi = matrix[n - 1][n - 1];
        while (lo < hi) {
            int mid = lo + (hi - lo) / 2;
            if (count(mid) >= k) hi = mid;
            else lo = mid + 1;
        }
        return lo;
    }
};
