// split, sort each half, merge: T(n) = 2T(n/2) + O(n) = O(n log n)
vector<int> mergeSort(const vector<int>& a) {
    if (a.size() <= 1) return a;
    size_t m = a.size() / 2;
    vector<int> L = mergeSort(vector<int>(a.begin(), a.begin() + m));
    vector<int> R = mergeSort(vector<int>(a.begin() + m, a.end()));
    vector<int> out;
    out.reserve(a.size());
    size_t i = 0, j = 0;
    while (i < L.size() && j < R.size()) out.push_back(L[i] <= R[j] ? L[i++] : R[j++]);   // <= keeps it stable
    out.insert(out.end(), L.begin() + i, L.end());
    out.insert(out.end(), R.begin() + j, R.end());
    return out;
}
// @test
    H::check(mergeSort({5, 2, 4, 6, 1, 3, 2, 6}), vector<int>{1, 2, 2, 3, 4, 5, 6, 6}, "merge sort");
    H::check(mergeSort({}), vector<int>{}, "empty");
    H::check(mergeSort({-1, -5, 3}), vector<int>{-5, -1, 3}, "negatives");
