class Solution {
public:
    int triangularSum(vector<int>& nums) {
        for (int len = nums.size(); len > 1; len--)        // each pass makes one shorter row
            for (int i = 0; i + 1 < len; i++) nums[i] = (nums[i] + nums[i + 1]) % 10;
        return nums[0];
    }
};
