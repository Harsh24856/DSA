class Solution {
public:
    int minDays(vector<int>& bloomDay, int m, int k) {
        if ((long long)m * k > (long long)bloomDay.size()) return -1;
        auto ok = [&](int d) {   // can we make m bouquets by day d?
            int made = 0, run = 0;
            for (int b : bloomDay) {
                run = b <= d ? run + 1 : 0;
                if (run == k) { made++; run = 0; }
            }
            return made >= m;
        };
        int lo = *min_element(bloomDay.begin(), bloomDay.end()), hi = *max_element(bloomDay.begin(), bloomDay.end());
        while (lo < hi) {
            int mid = lo + (hi - lo) / 2;
            if (ok(mid)) hi = mid;
            else lo = mid + 1;
        }
        return lo;
    }
};
