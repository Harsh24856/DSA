class Solution {
public:
    int maxEqualRowsAfterFlips(vector<vector<int>>& matrix) {
        map<vector<int>, int> c;   // row normalised so it starts with 0 -> count
        int best = 0;
        for (auto& row : matrix) {
            vector<int> key;
            for (int x : row) key.push_back(x ^ row[0]);
            best = max(best, ++c[key]);
        }
        return best;
    }
};
