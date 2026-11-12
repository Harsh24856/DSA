class Solution {
public:
    vector<vector<int>> getSkyline(vector<vector<int>>& buildings) {
        // (x, -height, right) for a start, (x, 0, 0) for an end: starts first, taller first
        vector<tuple<int, int, int>> events;
        for (auto& b : buildings) {
            events.push_back({b[0], -b[2], b[1]});
            events.push_back({b[1], 0, 0});
        }
        sort(events.begin(), events.end());
        vector<vector<int>> res{{0, 0}};
        priority_queue<pair<int, int>> heap;   // (height, right edge), tallest on top
        heap.push({0, INT_MAX});               // the ground never ends
        for (auto [x, negH, r] : events) {
            while (heap.top().second <= x) heap.pop();   // drop buildings that ended
            if (negH) heap.push({-negH, r});
            if (res.back()[1] != heap.top().first) res.push_back({x, heap.top().first});   // the height changed
        }
        res.erase(res.begin());
        return res;
    }
};
