class Solution {
public:
    vector<vector<int>> findFarmland(vector<vector<int>>& land) {
        int m = land.size(), n = land[0].size();
        vector<vector<int>> out;
        for (int i = 0; i < m; i++)
            for (int j = 0; j < n; j++)
                if (land[i][j] && (i == 0 || !land[i - 1][j]) && (j == 0 || !land[i][j - 1])) {   // top left corner
                    int r = i, c = j;
                    while (r + 1 < m && land[r + 1][j]) r++;
                    while (c + 1 < n && land[i][c + 1]) c++;
                    out.push_back({i, j, r, c});
                }
        return out;
    }
};
