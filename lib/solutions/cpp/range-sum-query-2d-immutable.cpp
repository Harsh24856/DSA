class NumMatrix {
    vector<vector<int>> P;                                 // P[i][j] = sum of the top-left i x j block
public:
    NumMatrix(vector<vector<int>>& matrix) {
        int m = matrix.size(), n = matrix[0].size();
        P.assign(m + 1, vector<int>(n + 1, 0));
        for (int i = 0; i < m; i++)
            for (int j = 0; j < n; j++)
                P[i + 1][j + 1] = matrix[i][j] + P[i][j + 1] + P[i + 1][j] - P[i][j];
    }

    int sumRegion(int row1, int col1, int row2, int col2) {
        return P[row2 + 1][col2 + 1] - P[row1][col2 + 1] - P[row2 + 1][col1] + P[row1][col1];
    }
};
// @test
    vector<vector<int>> mat{{3,0,1,4,2},{5,6,3,2,1},{1,2,0,1,5},{4,1,0,1,7},{1,0,3,0,5}};
    NumMatrix m(mat);
    H::check(vector<int>{m.sumRegion(2, 1, 4, 3), m.sumRegion(1, 1, 2, 2), m.sumRegion(1, 2, 2, 4)}, vector<int>{8, 11, 12}, "NumMatrix ex1");
    vector<vector<int>> one{{-4}};
    NumMatrix m1(one);
    H::check(m1.sumRegion(0, 0, 0, 0), -4, "NumMatrix 1x1");
