// mask from 0 to 2^n - 1: bit i set means nums[i] is in the subset
vector<vector<int>> subsets(const vector<int>& nums) {
    int n = nums.size();
    vector<vector<int>> out;
    for (int mask = 0; mask < (1 << n); mask++) {
        vector<int> cur;
        for (int i = 0; i < n; i++)
            if (mask >> i & 1) cur.push_back(nums[i]);
        out.push_back(cur);
    }
    return out;
}
// @test
    H::check(subsets({1, 2, 3}), vector<vector<int>>{{}, {1}, {2}, {1, 2}, {3}, {1, 3}, {2, 3}, {1, 2, 3}}, "subsets");
    H::check(subsets({}), vector<vector<int>>{{}}, "empty");
