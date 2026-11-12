class Solution {
public:
    vector<int> findDuplicates(vector<int>& nums) {
        vector<int> out;
        for (int x : nums) {
            int i = abs(x) - 1;
            if (nums[i] < 0) out.push_back(abs(x));   // already flipped: seen before
            else nums[i] = -nums[i];                  // mark value i + 1 as seen
        }
        return out;
    }
};
