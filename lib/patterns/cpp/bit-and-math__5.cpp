// X[i] = a[0] ^ ... ^ a[i-1]; xor(l..r) = X[r + 1] ^ X[l]
vector<int> xorQueries(const vector<int>& arr, const vector<vector<int>>& queries) {
    vector<int> X(arr.size() + 1, 0);
    for (size_t i = 0; i < arr.size(); i++) X[i + 1] = X[i] ^ arr[i];
    vector<int> out;
    for (auto& q : queries) out.push_back(X[q[1] + 1] ^ X[q[0]]);
    return out;
}

// AND of [m, n] keeps only the common high-bit prefix
int rangeAnd(int m, int n) {
    int shift = 0;
    while (m < n) { m >>= 1; n >>= 1; shift++; }
    return m << shift;
}
// @test
    H::check(xorQueries({1, 3, 4, 8}, {{0, 1}, {1, 2}, {0, 3}, {3, 3}}), vector<int>{2, 7, 14, 8}, "xor queries");
    H::check(rangeAnd(5, 7), 4, "range and");
    H::check(rangeAnd(0, 0), 0, "zero");
    H::check(rangeAnd(1, 2147483647), 0, "wide range");
