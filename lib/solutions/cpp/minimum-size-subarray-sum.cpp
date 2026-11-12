class Solution {
public:
    int minSubArrayLen(int target, vector<int>& nums) {
        int n = nums.size(), l = 0, s = 0, best = n + 1;
        for (int r = 0; r < n; r++) {
            s += nums[r];
            while (s >= target) {                          // shrink while still enough
                best = min(best, r - l + 1);
                s -= nums[l++];
            }
        }
        return best <= n ? best : 0;
    }
};
