// sort by start; an interval overlapping the last merged block must come right after it
vector<vector<int>> merge(vector<vector<int>> iv) {
    sort(iv.begin(), iv.end());
    vector<vector<int>> out;
    for (auto& v : iv) {
        if (!out.empty() && v[0] <= out.back()[1]) out.back()[1] = max(out.back()[1], v[1]);   // max: v may sit inside
        else out.push_back(v);
    }
    return out;
}
// @test
    H::check(merge({{1, 3}, {2, 6}, {8, 10}, {15, 18}}), vector<vector<int>>{{1, 6}, {8, 10}, {15, 18}}, "classic");
    H::check(merge({{1, 4}, {2, 3}}), vector<vector<int>>{{1, 4}}, "contained");
    H::check(merge({{1, 4}, {4, 5}}), vector<vector<int>>{{1, 5}}, "touching");
    H::check(merge({{5, 6}, {1, 2}}), vector<vector<int>>{{1, 2}, {5, 6}}, "unsorted input");
    H::check(merge({}), vector<vector<int>>{}, "empty");
