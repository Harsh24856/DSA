class Solution {
public:
    int numSubmatrixSumTarget(vector<vector<int>>& matrix, int target) {
        int m = matrix.size(), n = matrix[0].size(), ans = 0;
        for (int top = 0; top < m; top++) {
            vector<int> col(n, 0);   // column sums of rows top..bot
            for (int bot = top; bot < m; bot++) {
                for (int j = 0; j < n; j++) col[j] += matrix[bot][j];
                unordered_map<int, int> seen{{0, 1}};   // then subarray sum equals target on col
                int s = 0;
                for (int x : col) {
                    s += x;
                    if (auto it = seen.find(s - target); it != seen.end()) ans += it->second;
                    seen[s]++;
                }
            }
        }
        return ans;
    }
};
