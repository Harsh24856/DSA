class RangeModule {
    vector<int> pts;                           // sorted ends: [pts[0], pts[1]), [pts[2], pts[3]), ...

    // replace pts[i..j) with the given ends
    void splice(int i, int j, vector<int> ends) {
        pts.erase(pts.begin() + i, pts.begin() + j);
        pts.insert(pts.begin() + i, ends.begin(), ends.end());
    }
public:
    RangeModule() {}

    void addRange(int left, int right) {
        int i = lower_bound(pts.begin(), pts.end(), left) - pts.begin();
        int j = upper_bound(pts.begin(), pts.end(), right) - pts.begin();
        vector<int> ends;
        if (i % 2 == 0) ends.push_back(left);       // left falls outside a range: it starts one
        if (j % 2 == 0) ends.push_back(right);      // right falls outside a range: it ends one
        splice(i, j, ends);
    }

    bool queryRange(int left, int right) {
        int i = upper_bound(pts.begin(), pts.end(), left) - pts.begin();
        int j = lower_bound(pts.begin(), pts.end(), right) - pts.begin();
        return i == j && i % 2 == 1;                 // both inside the same range
    }

    void removeRange(int left, int right) {
        int i = lower_bound(pts.begin(), pts.end(), left) - pts.begin();
        int j = upper_bound(pts.begin(), pts.end(), right) - pts.begin();
        vector<int> ends;
        if (i % 2 == 1) ends.push_back(left);       // left is inside a range: cut it there
        if (j % 2 == 1) ends.push_back(right);
        splice(i, j, ends);
    }
};
// @test
    RangeModule rm;
    rm.addRange(10, 20); rm.removeRange(14, 16);
    H::check(vector<bool>{rm.queryRange(10, 14), rm.queryRange(13, 15), rm.queryRange(16, 17)}, vector<bool>{true, false, true}, "RangeModule");
    RangeModule rm2;
    rm2.addRange(10, 20); rm2.addRange(20, 30);
    H::check(rm2.queryRange(10, 30), true, "merge");
    rm2.removeRange(5, 40);
    H::check(rm2.queryRange(10, 11), false, "removed");
