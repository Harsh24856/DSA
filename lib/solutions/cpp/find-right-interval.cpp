class Solution {
public:
    vector<int> findRightInterval(vector<vector<int>>& intervals) {
        vector<pair<int, int>> starts;   // (start, index), sorted
        for (int i = 0; i < (int)intervals.size(); i++) starts.push_back({intervals[i][0], i});
        sort(starts.begin(), starts.end());
        vector<int> out;
        for (auto& iv : intervals) {
            auto it = lower_bound(starts.begin(), starts.end(), pair{iv[1], INT_MIN});   // first start >= end
            out.push_back(it != starts.end() ? it->second : -1);
        }
        return out;
    }
};
