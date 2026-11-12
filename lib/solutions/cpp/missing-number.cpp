class Solution {
public:
    int missingNumber(vector<int>& nums) {
        int x = nums.size();
        for (int i = 0; i < (int)nums.size(); i++) x ^= i ^ nums[i];   // every present number cancels its index
        return x;
    }
};
