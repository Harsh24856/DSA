class Solution {
public:
    int maximumGap(vector<int>& nums) {
        int n = nums.size();
        auto [lo_it, hi_it] = minmax_element(nums.begin(), nums.end());
        int lo = *lo_it, hi = *hi_it;
        if (n < 2 || lo == hi) return 0;
        int size = max(1, (hi - lo) / (n - 1));   // the answer is at least this, so no gap hides inside a bucket
        int m = (hi - lo) / size + 1;
        vector<int> bmin(m, INT_MAX), bmax(m, INT_MIN);
        for (int x : nums) {
            int b = (x - lo) / size;
            bmin[b] = min(bmin[b], x);
            bmax[b] = max(bmax[b], x);
        }
        int best = 0, prev = lo;
        for (int b = 0; b < m; b++) {
            if (bmin[b] == INT_MAX) continue;      // empty bucket
            best = max(best, bmin[b] - prev);      // gap between neighbouring buckets
            prev = bmax[b];
        }
        return best;
    }
};
