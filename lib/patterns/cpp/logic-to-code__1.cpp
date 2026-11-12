// spiral: walk a side, shrink that boundary; re-check before the bottom and left sides
vector<int> spiral(const vector<vector<int>>& m) {
    vector<int> out;
    if (m.empty()) return out;
    int top = 0, bot = (int)m.size() - 1, left = 0, right = (int)m[0].size() - 1;
    while (top <= bot && left <= right) {
        for (int c = left; c <= right; c++) out.push_back(m[top][c]);
        top++;
        for (int r = top; r <= bot; r++) out.push_back(m[r][right]);
        right--;
        if (top <= bot) {                        // a single remaining row was already printed
            for (int c = right; c >= left; c--) out.push_back(m[bot][c]);
            bot--;
        }
        if (left <= right) {                     // a single remaining column too
            for (int r = bot; r >= top; r--) out.push_back(m[r][left]);
            left++;
        }
    }
    return out;
}
// @test
    H::check(spiral({{1, 2, 3}, {4, 5, 6}, {7, 8, 9}}), vector<int>{1, 2, 3, 6, 9, 8, 7, 4, 5}, "3 x 3");
    H::check(spiral({{1, 2, 3, 4}, {5, 6, 7, 8}, {9, 10, 11, 12}}), vector<int>{1, 2, 3, 4, 8, 12, 11, 10, 9, 5, 6, 7}, "3 x 4");
    H::check(spiral({{1}, {2}, {3}}), vector<int>{1, 2, 3}, "one column");
    H::check(spiral({{1, 2, 3}}), vector<int>{1, 2, 3}, "one row");
    H::check(spiral({}), vector<int>{}, "empty");
