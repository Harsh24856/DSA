class Solution {
public:
    void rotate(vector<vector<int>>& matrix) {
        int n = matrix.size();
        for (int i = 0; i < n; i++)
            for (int j = i + 1; j < n; j++) swap(matrix[i][j], matrix[j][i]);   // transpose
        for (auto& row : matrix) reverse(row.begin(), row.end());               // then mirror each row
    }
};
// @test
    vector<vector<int>> a{{1,2,3},{4,5,6},{7,8,9}}; Solution().rotate(a);
    H::check(a, vector<vector<int>>{{7,4,1},{8,5,2},{9,6,3}}, "rotate 3x3");
    vector<vector<int>> b{{5,1,9,11},{2,4,8,10},{13,3,6,7},{15,14,12,16}}; Solution().rotate(b);
    H::check(b, vector<vector<int>>{{15,13,2,5},{14,3,4,1},{12,6,8,9},{16,7,10,11}}, "rotate 4x4");
