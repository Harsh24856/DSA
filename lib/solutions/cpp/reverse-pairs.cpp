class Solution {
    // sorts a[lo, hi) and returns the reverse pairs inside it
    int sortCount(vector<int>& a, int lo, int hi) {
        if (hi - lo <= 1) return 0;
        int mid = (lo + hi) / 2;
        int cnt = sortCount(a, lo, mid) + sortCount(a, mid, hi);
        int j = mid;
        for (int i = lo; i < mid; i++) {   // both halves sorted: j only moves forward
            while (j < hi && a[i] > 2LL * a[j]) j++;
            cnt += j - mid;
        }
        inplace_merge(a.begin() + lo, a.begin() + mid, a.begin() + hi);
        return cnt;
    }

public:
    int reversePairs(vector<int>& nums) {
        return sortCount(nums, 0, nums.size());
    }
};
