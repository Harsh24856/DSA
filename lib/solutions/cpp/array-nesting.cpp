class Solution {
public:
    int arrayNesting(vector<int>& nums) {
        vector<bool> seen(nums.size(), false);
        int best = 0;
        for (int s = 0; s < (int)nums.size(); s++) {
            int i = s, length = 0;
            while (!seen[i]) {          // walk the cycle once
                seen[i] = true;
                i = nums[i];
                length++;
            }
            best = max(best, length);
        }
        return best;
    }
};
