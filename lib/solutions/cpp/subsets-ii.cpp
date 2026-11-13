class Solution {
public:
    vector<vector<int>> subsetsWithDup(vector<int>& nums) {
        sort(nums.begin(), nums.end());
        vector<vector<int>> out;
        vector<int> path;
        function<void(size_t)> go = [&](size_t start) {
            out.push_back(path);                               // every node is a subset
            for (size_t i = start; i < nums.size(); i++) {
                if (i > start && nums[i] == nums[i - 1]) continue;   // same value at the same depth
                path.push_back(nums[i]);
                go(i + 1);
                path.pop_back();
            }
        };
        go(0);
        return out;
    }
};
