// fewest groups (rooms): sort by start; reuse the room that frees up earliest, or open a new one
int minGroups(vector<vector<int>> iv) {
    sort(iv.begin(), iv.end());
    priority_queue<int, vector<int>, greater<int>> ends;   // end time of the last interval in each group
    for (auto& v : iv) {
        if (!ends.empty() && ends.top() < v[0]) ends.pop(); // closed intervals: must end strictly before
        ends.push(v[1]);
    }
    return ends.size();
}
// @test
    H::check(minGroups({{5, 10}, {6, 8}, {1, 5}, {2, 3}, {1, 10}}), 3, "classic");
    H::check(minGroups({{1, 3}, {5, 6}, {8, 10}, {11, 13}}), 1, "disjoint");
    H::check(minGroups({{1, 5}, {5, 9}}), 2, "touching closed intervals clash");
    H::check(minGroups({}), 0, "empty");
