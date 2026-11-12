class SnapshotArray {
    vector<vector<pair<int, int>>> h;                  // per index: (snap id, value) in snap order
    int snapId = 0;
public:
    SnapshotArray(int length) : h(length, {{-1, 0}}) {}

    void set(int index, int val) {
        auto& hist = h[index];
        if (hist.back().first == snapId) hist.back().second = val;   // overwrite within the same snap
        else hist.push_back({snapId, val});
    }

    int snap() { return snapId++; }

    int get(int index, int snap_id) {
        auto& hist = h[index];
        // last change made at or before snap_id
        return prev(upper_bound(hist.begin(), hist.end(), pair{snap_id, INT_MAX}))->second;
    }
};
// @test
    SnapshotArray sa(3);
    vector<int> got;
    sa.set(0, 5); got.push_back(sa.snap()); sa.set(0, 6); got.push_back(sa.get(0, 0));
    sa.set(1, 2); got.push_back(sa.snap());
    for (auto [i, s] : vector<pair<int, int>>{{0, 1}, {1, 0}, {1, 1}, {2, 1}}) got.push_back(sa.get(i, s));
    H::check(got, vector<int>{0, 5, 1, 6, 0, 2, 0}, "SnapshotArray");
