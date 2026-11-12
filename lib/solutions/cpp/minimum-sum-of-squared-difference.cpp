class Solution {
public:
    long long minSumSquareDiff(vector<int>& nums1, vector<int>& nums2, int k1, int k2) {
        vector<long long> d;
        for (size_t i = 0; i < nums1.size(); i++) d.push_back(abs(nums1[i] - nums2[i]));
        sort(d.rbegin(), d.rend());
        long long k = (long long)k1 + k2;
        if (accumulate(d.begin(), d.end(), 0LL) <= k) return 0;
        d.push_back(0);
        long long i = 0;                 // d[0..i] are all levelled to d[i]
        while ((i + 1) * (d[i] - d[i + 1]) <= k) {
            k -= (i + 1) * (d[i] - d[i + 1]);
            i++;
        }
        long long q = k / (i + 1), r = k % (i + 1);
        long long level = d[i] - q;      // r of them go one lower still
        long long ans = r * (level - 1) * (level - 1) + (i + 1 - r) * level * level;
        for (size_t j = i + 1; j < d.size(); j++) ans += d[j] * d[j];
        return ans;
    }
};
