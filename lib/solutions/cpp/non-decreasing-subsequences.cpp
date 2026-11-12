class Solution {
    vector<vector<int>> out;
    vector<int> path;
    void go(const vector<int>& nums, int start) {
        if (path.size() > 1) out.push_back(path);
        unordered_set<int> used;                 // values already tried at this depth
        for (int i = start; i < (int)nums.size(); i++) {
            if (used.count(nums[i]) || (!path.empty() && nums[i] < path.back())) continue;
            used.insert(nums[i]);
            path.push_back(nums[i]);
            go(nums, i + 1);
            path.pop_back();
        }
    }
public:
    vector<vector<int>> findSubsequences(vector<int>& nums) {
        go(nums, 0);
        return out;
    }
};
