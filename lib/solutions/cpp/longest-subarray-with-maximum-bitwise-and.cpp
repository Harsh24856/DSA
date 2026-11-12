class Solution {
public:
    int longestSubarray(vector<int>& nums) {
        int mx = *max_element(nums.begin(), nums.end());
        int best = 0, run = 0;
        for (int x : nums) {
            run = x == mx ? run + 1 : 0;   // longest run of the maximum
            best = max(best, run);
        }
        return best;
    }
};
