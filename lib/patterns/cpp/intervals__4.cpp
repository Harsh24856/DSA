// two pointers: the overlap of the current pair is [max starts, min ends]; advance whichever ends first
vector<vector<int>> intervalIntersection(const vector<vector<int>>& A, const vector<vector<int>>& B) {
    vector<vector<int>> out;
    size_t i = 0, j = 0;
    while (i < A.size() && j < B.size()) {
        int lo = max(A[i][0], B[j][0]), hi = min(A[i][1], B[j][1]);
        if (lo <= hi) out.push_back({lo, hi});
        if (A[i][1] < B[j][1]) i++;              // it cannot overlap anything later in B
        else j++;
    }
    return out;
}
// @test
    H::check(intervalIntersection({{0, 2}, {5, 10}, {13, 23}, {24, 25}}, {{1, 5}, {8, 12}, {15, 24}, {25, 26}}),
             vector<vector<int>>{{1, 2}, {5, 5}, {8, 10}, {15, 23}, {24, 24}, {25, 25}}, "classic");
    H::check(intervalIntersection({{1, 3}, {5, 9}}, {}), vector<vector<int>>{}, "one empty");
    H::check(intervalIntersection({{1, 7}}, {{3, 10}}), vector<vector<int>>{{3, 7}}, "single pair");
