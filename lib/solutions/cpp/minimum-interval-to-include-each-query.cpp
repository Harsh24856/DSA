class Solution {
public:
    vector<int> minInterval(vector<vector<int>>& intervals, vector<int>& queries) {
        sort(intervals.begin(), intervals.end());
        priority_queue<pair<int, int>, vector<pair<int, int>>, greater<>> heap;   // (size, right end), smallest first
        map<int, int> best;
        size_t i = 0;
        for (int q : set<int>(queries.begin(), queries.end())) {
            while (i < intervals.size() && intervals[i][0] <= q) {   // every interval that starts by q
                int l = intervals[i][0], r = intervals[i][1];
                heap.push({r - l + 1, r});
                i++;
            }
            while (!heap.empty() && heap.top().second < q) heap.pop();   // drop intervals that ended before q
            best[q] = heap.empty() ? -1 : heap.top().first;
        }
        vector<int> out;
        for (int q : queries) out.push_back(best[q]);
        return out;
    }
};
