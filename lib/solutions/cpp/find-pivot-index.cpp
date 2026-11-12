class Solution {
public:
    int pivotIndex(vector<int>& nums) {
        int total = accumulate(nums.begin(), nums.end(), 0), left = 0;
        for (int i = 0; i < (int)nums.size(); i++) {
            if (left == total - left - nums[i]) return i;  // left sum equals right sum
            left += nums[i];
        }
        return -1;
    }
};
