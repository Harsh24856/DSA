class Solution {
public:
    int maxProduct(vector<int>& nums) {
        long long hi = nums[0], lo = nums[0], best = nums[0];   // largest and smallest product ending here
        for (size_t i = 1; i < nums.size(); i++) {
            long long x = nums[i];
            if (x < 0) swap(hi, lo);                       // a negative flips them
            hi = max(x, hi * x);
            lo = min(x, lo * x);
            best = max(best, hi);
        }
        return best;
    }
};
