class Solution {
public:
    vector<vector<int>> permuteUnique(vector<int>& nums) {
        sort(nums.begin(), nums.end());
        vector<vector<int>> out;
        vector<int> path;
        vector<bool> used(nums.size(), false);
        function<void()> go = [&]() {
            if (path.size() == nums.size()) { out.push_back(path); return; }
            for (size_t i = 0; i < nums.size(); i++) {
                // equal values are used left to right only, so each arrangement appears once
                if (used[i] || (i > 0 && nums[i] == nums[i - 1] && !used[i - 1])) continue;
                used[i] = true; path.push_back(nums[i]);
                go();
                path.pop_back(); used[i] = false;
            }
        };
        go();
        return out;
    }
};
