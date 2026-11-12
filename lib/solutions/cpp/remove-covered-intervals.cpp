class Solution {
public:
    int removeCoveredIntervals(vector<vector<int>>& intervals) {
        // by start, and the longer one first when starts tie
        sort(intervals.begin(), intervals.end(), [](auto& x, auto& y) { return x[0] != y[0] ? x[0] < y[0] : x[1] > y[1]; });
        int count = 0, right = 0;
        for (auto& iv : intervals)
            if (iv[1] > right) { count++; right = iv[1]; }   // not inside an earlier interval
        return count;
    }
};
