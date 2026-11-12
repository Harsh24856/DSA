class Solution {
public:
    vector<int> smallestRange(vector<vector<int>>& nums) {
        // (value, list, index in list): the smallest current value of every list
        priority_queue<tuple<int, int, int>, vector<tuple<int, int, int>>, greater<>> heap;
        int hi = INT_MIN;
        for (int i = 0; i < (int)nums.size(); i++) {
            heap.push({nums[i][0], i, 0});
            hi = max(hi, nums[i][0]);
        }
        vector<int> best{get<0>(heap.top()), hi};
        while (true) {
            auto [lo, i, j] = heap.top();
            heap.pop();
            if ((long long)hi - lo < (long long)best[1] - best[0]) best = {lo, hi};
            if (j + 1 == (int)nums[i].size()) return best;   // a list ran out
            int nxt = nums[i][j + 1];
            hi = max(hi, nxt);
            heap.push({nxt, i, j + 1});
        }
    }
};
