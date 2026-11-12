// prefix[i] = sum of a[0..i-1], so the sum of a[l..r] is prefix[r + 1] - prefix[l]
vector<long long> buildPrefix(const vector<int>& a) {
    vector<long long> prefix(a.size() + 1, 0);
    for (size_t i = 0; i < a.size(); i++) prefix[i + 1] = prefix[i] + a[i];
    return prefix;
}

long long rangeSum(const vector<long long>& prefix, int l, int r) { return prefix[r + 1] - prefix[l]; }

// count subarrays with sum k: a map of how often each earlier prefix sum appeared
int subarraySum(const vector<int>& a, int k) {
    unordered_map<long long, int> seen{{0, 1}};
    long long run = 0;
    int count = 0;
    for (int x : a) {
        run += x;
        if (auto it = seen.find(run - k); it != seen.end()) count += it->second;
        seen[run]++;
    }
    return count;
}
// @test
    auto p = buildPrefix({2, -1, 3, 4});
    H::check(rangeSum(p, 1, 3), 6LL, "range sum");
    H::check(subarraySum({1, 1, 1}, 2), 2, "subarray sum k");
    H::check(subarraySum({1, 2, 3}, 3), 2, "subarray sum k 2");
