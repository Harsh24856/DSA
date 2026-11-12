class Solution {
public:
    vector<int> findDisappearedNumbers(vector<int>& nums) {
        for (int x : nums) {
            int i = abs(x) - 1;
            nums[i] = -abs(nums[i]);                       // mark value i + 1 as seen
        }
        vector<int> out;
        for (int i = 0; i < (int)nums.size(); i++)
            if (nums[i] > 0) out.push_back(i + 1);
        return out;
    }
};
