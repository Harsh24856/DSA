class Solution {
public:
    int minGroups(vector<vector<int>>& intervals) {
        sort(intervals.begin(), intervals.end());
        priority_queue<int, vector<int>, greater<>> ends;   // end of each group's last interval
        for (auto& iv : intervals) {
            if (!ends.empty() && ends.top() < iv[0]) ends.pop();   // reuse the group that ends first
            ends.push(iv[1]);
        }
        return ends.size();
    }
};
