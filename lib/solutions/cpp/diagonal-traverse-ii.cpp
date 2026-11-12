class Solution {
public:
    vector<int> findDiagonalOrder(vector<vector<int>>& nums) {
        map<int, vector<int>> groups;   // i + j names an anti-diagonal
        for (int i = nums.size() - 1; i >= 0; i--)   // bottom rows first, so each diagonal reads upward
            for (int j = 0; j < (int)nums[i].size(); j++) groups[i + j].push_back(nums[i][j]);
        vector<int> out;
        for (auto& [d, v] : groups) out.insert(out.end(), v.begin(), v.end());
        return out;
    }
};
