class Solution {
public:
    vector<vector<int>> generateMatrix(int n) {
        vector<vector<int>> g(n, vector<int>(n));
        int top = 0, bottom = n - 1, left = 0, right = n - 1, k = 1;
        while (top <= bottom && left <= right) {
            for (int c = left; c <= right; c++) g[top][c] = k++;
            top++;
            for (int r = top; r <= bottom; r++) g[r][right] = k++;
            right--;
            if (top <= bottom) { for (int c = right; c >= left; c--) g[bottom][c] = k++; bottom--; }
            if (left <= right) { for (int r = bottom; r >= top; r--) g[r][left] = k++; left++; }
        }
        return g;
    }
};
