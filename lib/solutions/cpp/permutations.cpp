class Solution {
public:
    vector<vector<int>> permute(vector<int>& nums) {
        vector<vector<int>> out;
        vector<int> path;
        vector<bool> used(nums.size(), false);
        function<void()> dfs = [&]() {
            if (path.size() == nums.size()) { out.push_back(path); return; }
            for (size_t i = 0; i < nums.size(); i++) {
                if (used[i]) continue;
                used[i] = true;
                path.push_back(nums[i]);
                dfs();
                path.pop_back();                       // undo the choice
                used[i] = false;
            }
        };
        dfs();
        return out;
    }
};
