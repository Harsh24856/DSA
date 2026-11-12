class Solution {
public:
    vector<vector<int>> insert(vector<vector<int>>& intervals, vector<int>& newInterval) {
        vector<vector<int>> out;
        int i = 0, n = intervals.size();
        int s = newInterval[0], e = newInterval[1];
        while (i < n && intervals[i][1] < s) out.push_back(intervals[i++]);   // entirely before
        while (i < n && intervals[i][0] <= e) {                                // overlapping: merge
            s = min(s, intervals[i][0]);
            e = max(e, intervals[i][1]);
            i++;
        }
        out.push_back({s, e});
        while (i < n) out.push_back(intervals[i++]);                           // entirely after
        return out;
    }
};
