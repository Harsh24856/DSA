class Solution {
public:
    int equalPairs(vector<vector<int>>& grid) {
        int n = grid.size();
        map<vector<int>, int> rows;
        for (auto& r : grid) rows[r]++;
        int ans = 0;
        for (int j = 0; j < n; j++) {
            vector<int> col(n);
            for (int i = 0; i < n; i++) col[i] = grid[i][j];
            auto it = rows.find(col);
            if (it != rows.end()) ans += it->second;   // every row equal to this column
        }
        return ans;
    }
};
