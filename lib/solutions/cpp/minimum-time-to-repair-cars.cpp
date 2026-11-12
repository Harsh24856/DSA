class Solution {
    static long long isqrt(long long x) {
        long long s = sqrtl((long double)x);
        while (s * s > x) s--;
        while ((s + 1) * (s + 1) <= x) s++;
        return s;
    }
public:
    long long repairCars(vector<int>& ranks, int cars) {
        long long lo = 1, hi = (long long)*min_element(ranks.begin(), ranks.end()) * cars * cars;
        while (lo < hi) {
            long long mid = lo + (hi - lo) / 2;
            long long fixed = 0;
            for (int r : ranks) fixed += isqrt(mid / r);   // r * c^2 <= mid
            if (fixed >= cars) hi = mid;
            else lo = mid + 1;
        }
        return lo;
    }
};
