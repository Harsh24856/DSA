class Solution {
public:
    void setZeroes(vector<vector<int>>& matrix) {
        int m = matrix.size(), n = matrix[0].size();
        bool firstRow = false, firstCol = false;
        for (int j = 0; j < n; j++) if (matrix[0][j] == 0) firstRow = true;
        for (int i = 0; i < m; i++) if (matrix[i][0] == 0) firstCol = true;
        for (int i = 1; i < m; i++)
            for (int j = 1; j < n; j++)
                if (matrix[i][j] == 0) matrix[i][0] = matrix[0][j] = 0;   // first row and column hold the marks
        for (int i = 1; i < m; i++)
            for (int j = 1; j < n; j++)
                if (matrix[i][0] == 0 || matrix[0][j] == 0) matrix[i][j] = 0;
        if (firstRow) for (int j = 0; j < n; j++) matrix[0][j] = 0;
        if (firstCol) for (int i = 0; i < m; i++) matrix[i][0] = 0;
    }
};
// @test
    vector<vector<int>> a{{1,1,1},{1,0,1},{1,1,1}}; Solution().setZeroes(a);
    H::check(a, vector<vector<int>>{{1,0,1},{0,0,0},{1,0,1}}, "setZeroes a");
    vector<vector<int>> b{{0,1,2,0},{3,4,5,2},{1,3,1,5}}; Solution().setZeroes(b);
    H::check(b, vector<vector<int>>{{0,0,0,0},{0,4,5,0},{0,3,1,0}}, "setZeroes b");
