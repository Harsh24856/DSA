class Solution {
public:
    int partitionDisjoint(vector<int>& nums) {
        int leftMax = nums[0], curMax = nums[0], cut = 0;
        for (int i = 1; i < (int)nums.size(); i++) {
            curMax = max(curMax, nums[i]);
            if (nums[i] < leftMax) {   // nums[i] must join the left part
                cut = i;
                leftMax = curMax;
            }
        }
        return cut + 1;
    }
};
