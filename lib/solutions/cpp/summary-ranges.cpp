class Solution {
public:
    vector<string> summaryRanges(vector<int>& nums) {
        vector<string> out;
        size_t i = 0;
        while (i < nums.size()) {
            size_t j = i;
            while (j + 1 < nums.size() && (long long)nums[j + 1] == (long long)nums[j] + 1) j++;   // extend the run
            out.push_back(i == j ? to_string(nums[i]) : to_string(nums[i]) + "->" + to_string(nums[j]));
            i = j + 1;
        }
        return out;
    }
};
