// merge sort that counts inversions (pairs i < j with a[i] > a[j]) while it merges
long long sortCount(vector<int>& a, vector<int>& buf, int lo, int hi) {      // sorts a[lo, hi)
    if (hi - lo < 2) return 0;
    int mid = (lo + hi) / 2;
    long long inv = sortCount(a, buf, lo, mid) + sortCount(a, buf, mid, hi);
    int i = lo, j = mid, k = lo;
    while (i < mid && j < hi) {
        if (a[i] <= a[j]) buf[k++] = a[i++];                 // <= keeps equal values from counting
        else { buf[k++] = a[j++]; inv += mid - i; }          // a[j] is smaller than every left value still waiting
    }
    while (i < mid) buf[k++] = a[i++];
    while (j < hi) buf[k++] = a[j++];
    copy(buf.begin() + lo, buf.begin() + hi, a.begin() + lo);
    return inv;
}

pair<vector<int>, long long> countInversions(vector<int> a) {
    vector<int> buf(a.size());
    long long inv = sortCount(a, buf, 0, a.size());
    return {a, inv};
}
// @test
    H::check(countInversions({2, 4, 1, 3, 5}).second, 3LL, "three inversions");
    H::check(countInversions({5, 4, 3, 2, 1}).second, 10LL, "reversed: n(n-1)/2");
    H::check(countInversions({1, 2, 3}).second, 0LL, "sorted");
    H::check(countInversions({2, 2, 1}).second, 2LL, "equal values do not count");
    H::check(countInversions({}).second, 0LL, "empty");
    H::check(countInversions({5, 2, 4, 6, 1, 3}).first, vector<int>{1, 2, 3, 4, 5, 6}, "also sorts");
