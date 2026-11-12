// greedy cover of [0, T]: among clips starting inside the covered part, take the one reaching furthest
int minCover(vector<vector<int>> clips, int T) {
    sort(clips.begin(), clips.end());
    int count = 0, reach = 0;                    // [0, reach] is covered
    size_t i = 0;
    while (reach < T) {
        int best = reach;
        while (i < clips.size() && clips[i][0] <= reach) best = max(best, clips[i++][1]);
        if (best == reach) return -1;            // a gap that no clip covers
        count++;
        reach = best;
    }
    return count;
}
// @test
    H::check(minCover({{0, 2}, {4, 6}, {8, 10}, {1, 9}, {1, 5}, {5, 9}}, 10), 3, "video stitching");
    H::check(minCover({{0, 1}, {1, 2}}, 5), -1, "cannot reach");
    H::check(minCover({{0, 4}, {2, 8}}, 5), 2, "overshoot is fine");
    H::check(minCover({{1, 4}}, 3), -1, "gap at zero");
    H::check(minCover({}, 0), 0, "nothing to cover");
