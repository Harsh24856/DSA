class Solution {
public:
    int maxTwoEvents(vector<vector<int>>& events) {
        sort(events.begin(), events.end());              // by start
        int n = events.size();
        vector<int> starts(n), bestAfter(n + 1, 0);      // bestAfter[i] = max value among events[i..]
        for (int i = 0; i < n; i++) starts[i] = events[i][0];
        for (int i = n - 1; i >= 0; i--) bestAfter[i] = max(bestAfter[i + 1], events[i][2]);
        int ans = 0;
        for (auto& ev : events) {
            int j = upper_bound(starts.begin(), starts.end(), ev[1]) - starts.begin();   // starts after it ends
            ans = max(ans, ev[2] + bestAfter[j]);
        }
        return ans;
    }
};
