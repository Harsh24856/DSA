class Solution {
public:
    int longestOnes(vector<int>& nums, int k) {
        int L = 0, zeros = 0, best = 0;
        for (int R = 0; R < (int)nums.size(); R++) {
            zeros += nums[R] == 0;
            while (zeros > k) {          // too many flips: drop from the left
                zeros -= nums[L] == 0;
                L++;
            }
            best = max(best, R - L + 1);
        }
        return best;
    }
};
