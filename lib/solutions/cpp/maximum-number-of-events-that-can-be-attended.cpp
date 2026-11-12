class Solution {
public:
    int maxEvents(vector<vector<int>>& events) {
        sort(events.begin(), events.end());
        priority_queue<int, vector<int>, greater<int>> heap;   // end days of open events
        int i = 0, n = events.size(), day = 0, ans = 0;
        while (i < n || !heap.empty()) {
            if (heap.empty()) day = max(day, events[i][0]);   // jump to the next start
            while (i < n && events[i][0] <= day) heap.push(events[i++][1]);
            heap.pop();   // attend the one that ends first
            ans++;
            day++;
            while (!heap.empty() && heap.top() < day) heap.pop();   // drop events already over
        }
        return ans;
    }
};
