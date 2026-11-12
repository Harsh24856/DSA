class Solution {
public:
    int eraseOverlapIntervals(vector<vector<int>>& intervals) {
        sort(intervals.begin(), intervals.end(), [](auto& a, auto& b) { return a[1] < b[1]; });   // earliest end first
        long long end = LLONG_MIN;
        int removed = 0;
        for (auto& iv : intervals) {
            if (iv[0] >= end) end = iv[1];
            else removed++;
        }
        return removed;
    }
};
