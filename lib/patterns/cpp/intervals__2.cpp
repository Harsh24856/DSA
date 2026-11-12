// sweep line: +1 at each start, -1 at each end; the running count peaks at the number of rooms needed
int minRooms(const vector<vector<int>>& iv) {
    vector<pair<int, int>> ev;
    for (auto& v : iv) { ev.push_back({v[0], 1}); ev.push_back({v[1], -1}); }
    sort(ev.begin(), ev.end());                  // at equal times -1 sorts first: a room frees before reuse
    int cur = 0, best = 0;
    for (auto [t, d] : ev) best = max(best, cur += d);
    return best;
}
// @test
    H::check(minRooms({{0, 30}, {5, 10}, {15, 20}}), 2, "classic");
    H::check(minRooms({{7, 10}, {2, 4}}), 1, "disjoint");
    H::check(minRooms({{1, 5}, {5, 10}}), 1, "touching shares a room");
    H::check(minRooms({{1, 5}, {2, 6}, {3, 7}}), 3, "all overlap");
    H::check(minRooms({}), 0, "empty");
