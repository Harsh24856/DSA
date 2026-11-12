class Solution {
public:
    int mostBooked(int n, vector<vector<int>>& meetings) {
        priority_queue<int, vector<int>, greater<int>> free;                    // room numbers
        for (int r = 0; r < n; r++) free.push(r);
        priority_queue<pair<long long, int>, vector<pair<long long, int>>, greater<>> busy;  // (end, room)
        vector<int> count(n, 0);
        sort(meetings.begin(), meetings.end());
        for (auto& m : meetings) {
            long long s = m[0], e = m[1];
            while (!busy.empty() && busy.top().first <= s) {   // rooms that are free by now
                free.push(busy.top().second);
                busy.pop();
            }
            int r;
            if (!free.empty()) {
                r = free.top();
                free.pop();
                busy.push({e, r});
            } else {                                           // wait for the first room to free up
                auto [end, room] = busy.top();
                busy.pop();
                r = room;
                busy.push({end + e - s, r});
            }
            count[r]++;
        }
        return max_element(count.begin(), count.end()) - count.begin();
    }
};
