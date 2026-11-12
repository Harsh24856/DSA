class Solution {
public:
    int uniquePaths(int m, int n) {
        vector<int> row(n, 1);                               // paths into each cell of the current row
        for (int r = 0; r < m - 1; r++)
            for (int c = 1; c < n; c++) row[c] += row[c - 1];   // from above plus from the left
        return row.back();
    }
};
