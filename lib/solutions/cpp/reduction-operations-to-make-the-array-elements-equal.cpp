class Solution {
public:
    int reductionOperations(vector<int>& nums) {
        sort(nums.begin(), nums.end());
        int ops = 0, steps = 0;
        for (int i = 1; i < (int)nums.size(); i++) {
            if (nums[i] != nums[i - 1]) steps++;   // one more distinct value below this one
            ops += steps;
        }
        return ops;
    }
};
