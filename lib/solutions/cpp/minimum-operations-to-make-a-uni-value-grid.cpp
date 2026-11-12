class Solution {
public:
    int minOperations(vector<vector<int>>& grid, int x) {
        vector<int> vals;
        for (auto& row : grid) vals.insert(vals.end(), row.begin(), row.end());
        sort(vals.begin(), vals.end());
        for (int v : vals) if ((v - vals[0]) % x) return -1;   // all must share a remainder
        int mid = vals[vals.size() / 2];                       // the median minimises the moves
        int ops = 0;
        for (int v : vals) ops += abs(v - mid) / x;
        return ops;
    }
};
