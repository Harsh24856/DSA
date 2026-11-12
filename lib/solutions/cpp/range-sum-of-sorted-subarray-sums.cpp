class Solution {
public:
    int rangeSum(vector<int>& nums, int n, int left, int right) {
        vector<long long> sums;   // every subarray sum
        for (int i = 0; i < n; i++) {
            long long s = 0;
            for (int j = i; j < n; j++) sums.push_back(s += nums[j]);
        }
        sort(sums.begin(), sums.end());
        long long total = 0;
        for (int k = left - 1; k < right; k++) total = (total + sums[k]) % 1000000007;
        return total;
    }
};
