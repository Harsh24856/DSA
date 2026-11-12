class Solution {
public:
    int numSubmat(vector<vector<int>>& mat) {
        int n = mat[0].size(), ans = 0;
        vector<int> h(n, 0);   // run of ones ending at this row, per column
        for (auto& row : mat) {
            for (int j = 0; j < n; j++) h[j] = row[j] ? h[j] + 1 : 0;
            for (int j = 0; j < n; j++) {
                int low = h[j];
                for (int k = j; k >= 0; k--) {   // rectangles with bottom-right corner at j
                    low = min(low, h[k]);
                    if (!low) break;
                    ans += low;
                }
            }
        }
        return ans;
    }
};
