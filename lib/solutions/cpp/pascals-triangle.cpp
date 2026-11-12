class Solution {
public:
    vector<vector<int>> generate(int numRows) {
        vector<vector<int>> rows{{1}};
        for (int r = 1; r < numRows; r++) {
            auto& prev = rows.back();
            vector<int> row{1};
            for (size_t i = 0; i + 1 < prev.size(); i++) row.push_back(prev[i] + prev[i + 1]);   // sum of the two above
            row.push_back(1);
            rows.push_back(row);
        }
        return rows;
    }
};
