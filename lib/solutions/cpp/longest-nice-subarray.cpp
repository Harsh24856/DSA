class Solution {
public:
    int longestNiceSubarray(vector<int>& nums) {
        int used = 0, L = 0, best = 0;   // used = OR of the window
        for (int R = 0; R < (int)nums.size(); R++) {
            int x = nums[R];
            while (used & x) {           // a shared bit: drop from the left
                used ^= nums[L];
                L++;
            }
            used |= x;
            best = max(best, R - L + 1);
        }
        return best;
    }
};
