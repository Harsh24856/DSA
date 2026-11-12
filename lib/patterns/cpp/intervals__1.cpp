// sort by start; extend the last merged interval while the next one starts inside it
vector<vector<int>> merge(vector<vector<int>> iv) {
    sort(iv.begin(), iv.end(), [](auto& a, auto& b) { return a[0] < b[0]; });
    vector<vector<int>> out;
    for (auto& v : iv) {
        if (!out.empty() && v[0] <= out.back()[1]) out.back()[1] = max(out.back()[1], v[1]);
        else out.push_back(v);
    }
    return out;
}
// @test
    H::check(merge({{1, 3}, {2, 6}, {8, 10}, {15, 18}}), vector<vector<int>>{{1, 6}, {8, 10}, {15, 18}}, "classic");
    H::check(merge({{1, 4}, {0, 4}}), vector<vector<int>>{{0, 4}}, "unsorted");
    H::check(merge({{1, 10}, {2, 3}, {4, 5}}), vector<vector<int>>{{1, 10}}, "contained");
    H::check(merge({}), vector<vector<int>>{}, "empty");
