class Solution {
public:
    int largestSubmatrix(vector<vector<int>>& matrix) {
        int n = matrix[0].size(), best = 0;
        vector<int> h(n, 0);
        for (auto& row : matrix) {
            for (int j = 0; j < n; j++) h[j] = row[j] ? h[j] + 1 : 0;   // run of 1s ending here
            vector<int> s = h;
            sort(s.rbegin(), s.rend());
            for (int w = 1; w <= n; w++) best = max(best, w * s[w - 1]);
        }
        return best;
    }
};
