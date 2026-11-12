class Solution {
public:
    bool canJump(vector<int>& nums) {
        int reach = 0;
        for (int i = 0; i < (int)nums.size(); i++) {
            if (i > reach) return false;                 // cannot get here
            reach = max(reach, i + nums[i]);
        }
        return true;
    }
};
