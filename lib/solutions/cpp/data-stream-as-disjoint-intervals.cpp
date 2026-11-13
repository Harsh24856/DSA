class SummaryRanges {
    map<int, int> iv;                                    // start -> end, disjoint
public:
    SummaryRanges() {}

    void addNum(int value) {
        auto right = iv.upper_bound(value);              // first interval starting after value
        if (right != iv.begin()) {
            auto left = prev(right);
            if (left->second >= value) return;           // already covered
            if (left->second == value - 1) {
                left->second = value;                    // stretch the left neighbour
                if (right != iv.end() && right->first == value + 1) {
                    left->second = right->second;        // value bridges two intervals
                    iv.erase(right);
                }
                return;
            }
        }
        if (right != iv.end() && right->first == value + 1) {
            int end = right->second;                     // stretch the right neighbour's start
            iv.erase(right);
            iv[value] = end;
        } else iv[value] = value;
    }

    vector<vector<int>> getIntervals() {
        vector<vector<int>> out;
        for (auto [s, e] : iv) out.push_back({s, e});
        return out;
    }
};
// @test
    SummaryRanges r;
    vector<vector<vector<int>>> got;
    for (int v : {1, 3, 7, 2, 6}) { r.addNum(v); got.push_back(r.getIntervals()); }
    H::check(got, vector<vector<vector<int>>>{{{1, 1}}, {{1, 1}, {3, 3}}, {{1, 1}, {3, 3}, {7, 7}}, {{1, 3}, {7, 7}}, {{1, 3}, {6, 7}}}, "SummaryRanges");
    SummaryRanges b;
    for (int v : {5, 5, 0, 4, 6, 2, 1, 3}) b.addNum(v);
    H::check(b.getIntervals(), vector<vector<int>>{{0, 6}}, "repeats and bridge");
