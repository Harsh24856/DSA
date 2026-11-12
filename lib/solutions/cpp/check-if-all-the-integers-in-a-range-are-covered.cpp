class Solution {
public:
    bool isCovered(vector<vector<int>>& ranges, int left, int right) {
        vector<int> diff(52, 0);
        for (auto& r : ranges) { diff[r[0]]++; diff[r[1] + 1]--; }
        int cover = 0;
        for (int x = 1; x <= right; x++) {
            cover += diff[x];                              // how many ranges cover x
            if (x >= left && cover == 0) return false;
        }
        return true;
    }
};
