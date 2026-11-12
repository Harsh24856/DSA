class Solution {
public:
    bool searchMatrix(vector<vector<int>>& matrix, int target) {
        int r = 0, c = matrix[0].size() - 1;   // start at the top right corner
        while (r < (int)matrix.size() && c >= 0) {
            int v = matrix[r][c];
            if (v == target) return true;
            if (v > target) c--;   // the whole column below is bigger
            else r++;              // the whole row to the left is smaller
        }
        return false;
    }
};
