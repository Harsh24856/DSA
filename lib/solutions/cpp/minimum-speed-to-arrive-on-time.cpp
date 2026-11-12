class Solution {
public:
    int minSpeedOnTime(vector<int>& dist, double hour) {
        int n = dist.size();
        if (hour <= n - 1) return -1;   // every train but the last takes a whole hour at least
        auto time = [&](int v) {
            long long whole = 0;
            for (int i = 0; i + 1 < n; i++) whole += (dist[i] + v - 1) / v;   // wait for the next whole hour
            return whole + (double)dist[n - 1] / v;
        };
        int lo = 1, hi = 10'000'000;
        while (lo < hi) {
            int mid = lo + (hi - lo) / 2;
            if (time(mid) <= hour) hi = mid;
            else lo = mid + 1;
        }
        return lo;
    }
};
