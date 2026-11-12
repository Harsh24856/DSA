class Solution {
public:
    long long countSubarrays(vector<int>& nums, int minK, int maxK) {
        int bad = -1, lo = -1, hi = -1;   // last index out of range, last minK, last maxK
        long long ans = 0;
        for (int i = 0; i < (int)nums.size(); i++) {
            int x = nums[i];
            if (x < minK || x > maxK) bad = i;
            if (x == minK) lo = i;
            if (x == maxK) hi = i;
            ans += max(0, min(lo, hi) - bad);   // valid starts for subarrays ending at i
        }
        return ans;
    }
};
