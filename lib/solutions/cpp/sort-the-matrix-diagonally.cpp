class Solution {
public:
    vector<vector<int>> diagonalSort(vector<vector<int>>& mat) {
        unordered_map<int, vector<int>> d;   // i - j names a diagonal
        for (int i = 0; i < (int)mat.size(); i++)
            for (int j = 0; j < (int)mat[i].size(); j++) d[i - j].push_back(mat[i][j]);
        for (auto& [k, v] : d) sort(v.rbegin(), v.rend());   // descending, so pop_back gives the smallest
        for (int i = 0; i < (int)mat.size(); i++)
            for (int j = 0; j < (int)mat[i].size(); j++) {
                mat[i][j] = d[i - j].back();
                d[i - j].pop_back();
            }
        return mat;
    }
};
