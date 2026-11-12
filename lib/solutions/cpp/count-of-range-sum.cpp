class Solution {
    vector<long long> pre;
    int lower, upper;

    // counts pairs i < j in pre[lo, hi) with lower <= pre[j] - pre[i] <= upper, then sorts the range
    int sortCount(int lo, int hi) {
        if (hi - lo <= 1) return 0;
        int mid = (lo + hi) / 2;
        int cnt = sortCount(lo, mid) + sortCount(mid, hi);
        int a = mid, b = mid;
        for (int i = lo; i < mid; i++) {   // both halves sorted: a and b only move forward
            while (a < hi && pre[a] - pre[i] < lower) a++;
            while (b < hi && pre[b] - pre[i] <= upper) b++;
            cnt += b - a;
        }
        inplace_merge(pre.begin() + lo, pre.begin() + mid, pre.begin() + hi);
        return cnt;
    }

public:
    int countRangeSum(vector<int>& nums, int lower, int upper) {
        this->lower = lower;
        this->upper = upper;
        pre = {0};
        for (int x : nums) pre.push_back(pre.back() + x);
        return sortCount(0, pre.size());
    }
};
