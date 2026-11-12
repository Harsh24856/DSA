// choose, explore, un-choose: one shared path, copied at each leaf
vector<vector<int>> subsets(const vector<int>& nums) {
    vector<vector<int>> out;
    vector<int> path;
    function<void(size_t)> bt = [&](size_t i) {
        if (i == nums.size()) { out.push_back(path); return; }   // push_back copies
        bt(i + 1);                    // skip nums[i]
        path.push_back(nums[i]);      // take nums[i]
        bt(i + 1);
        path.pop_back();              // undo
    };
    bt(0);
    return out;
}
// @test
    H::check(subsets({1, 2, 3}), vector<vector<int>>{{}, {3}, {2}, {2, 3}, {1}, {1, 3}, {1, 2}, {1, 2, 3}}, "subsets");
    H::check(subsets({}), vector<vector<int>>{{}}, "empty set");
    H::check(subsets({1, 2, 3, 4}).size(), (size_t)16, "2^n results");
