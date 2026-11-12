class Solution {
public:
    long long maxRunTime(int n, vector<int>& batteries) {
        long long lo = 0, hi = accumulate(batteries.begin(), batteries.end(), 0LL) / n;
        while (lo < hi) {
            long long mid = (lo + hi + 1) / 2, power = 0;
            for (int b : batteries) power += min<long long>(b, mid);   // a battery helps at most mid minutes
            if (power >= n * mid) lo = mid;
            else hi = mid - 1;
        }
        return lo;
    }
};
