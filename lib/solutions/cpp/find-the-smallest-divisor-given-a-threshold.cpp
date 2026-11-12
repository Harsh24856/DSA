class Solution {
public:
    int smallestDivisor(vector<int>& nums, int threshold) {
        int lo = 1, hi = *max_element(nums.begin(), nums.end());
        while (lo < hi) {
            int mid = lo + (hi - lo) / 2;
            long long s = 0;
            for (int x : nums) s += (x + mid - 1) / mid;   // ceiling division
            if (s <= threshold) hi = mid;
            else lo = mid + 1;
        }
        return lo;
    }
};
