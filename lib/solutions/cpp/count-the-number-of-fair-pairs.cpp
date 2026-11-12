class Solution {
public:
    long long countFairPairs(vector<int>& nums, int lower, int upper) {
        sort(nums.begin(), nums.end());
        // pairs with sum <= x, by two pointers
        auto count = [&](long long x) {
            long long c = 0;
            int L = 0, R = nums.size() - 1;
            while (L < R) {
                if ((long long)nums[L] + nums[R] <= x) {
                    c += R - L;      // nums[L] pairs with everything up to R
                    L++;
                } else R--;
            }
            return c;
        };
        return count(upper) - count((long long)lower - 1);
    }
};
