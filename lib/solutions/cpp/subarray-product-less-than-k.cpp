class Solution {
public:
    int numSubarrayProductLessThanK(vector<int>& nums, int k) {
        if (k <= 1) return 0;
        long long prod = 1;
        int L = 0, ans = 0;
        for (int R = 0; R < (int)nums.size(); R++) {
            prod *= nums[R];
            while (prod >= k) prod /= nums[L++];   // shrink until the product fits
            ans += R - L + 1;                       // subarrays ending at R
        }
        return ans;
    }
};
