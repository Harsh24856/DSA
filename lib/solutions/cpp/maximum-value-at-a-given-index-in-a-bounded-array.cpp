class Solution {
public:
    int maxValue(int n, int index, int maxSum) {
        auto side = [](long long v, long long length) -> long long {   // v-1, v-2, ... over length cells, min 1
            if (v - 1 >= length) return (2 * v - 1 - length) * length / 2;
            return v * (v - 1) / 2 + (length - (v - 1));
        };
        auto cost = [&](long long v) { return v + side(v, index) + side(v, n - index - 1); };
        int lo = 1, hi = maxSum;
        while (lo < hi) {
            int mid = lo + (hi - lo + 1) / 2;
            if (cost(mid) <= maxSum) lo = mid;
            else hi = mid - 1;
        }
        return lo;
    }
};
