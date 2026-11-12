class Solution {
public:
    vector<vector<char>> rotateTheBox(vector<vector<char>>& boxGrid) {
        int m = boxGrid.size(), n = boxGrid[0].size();
        for (auto& row : boxGrid) {
            int empty = n - 1;                             // lowest free slot on the right
            for (int j = n - 1; j >= 0; j--) {
                if (row[j] == '*') empty = j - 1;
                else if (row[j] == '#') { row[j] = '.'; row[empty] = '#'; empty--; }
            }
        }
        vector<vector<char>> out(n, vector<char>(m));
        for (int j = 0; j < n; j++)
            for (int i = 0; i < m; i++) out[j][i] = boxGrid[m - 1 - i][j];   // rotate clockwise
        return out;
    }
};
