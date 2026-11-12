class Solution {
public:
    int minAbsoluteSumDiff(vector<int>& nums1, vector<int>& nums2) {
        vector<int> s = nums1;
        sort(s.begin(), s.end());
        long long total = 0;
        int gain = 0;
        for (size_t i = 0; i < nums1.size(); i++) {
            int a = nums1[i], b = nums2[i], d = abs(a - b);
            total += d;
            auto it = lower_bound(s.begin(), s.end(), b);   // closest value in nums1 to b
            int best = d;
            if (it != s.end()) best = min(best, *it - b);
            if (it != s.begin()) best = min(best, b - *prev(it));
            gain = max(gain, d - best);                     // best single replacement
        }
        return (total - gain) % 1'000'000'007;
    }
};
