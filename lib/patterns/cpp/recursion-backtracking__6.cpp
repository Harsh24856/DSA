// all subset sums of a range, built by doubling: every old sum with and without x
vector<long long> subsetSums(const vector<int>& a, size_t from, size_t to) {
    vector<long long> sums{0};
    for (size_t k = from; k < to; k++) {
        size_t m = sums.size();
        for (size_t i = 0; i < m; i++) sums.push_back(sums[i] + a[k]);
    }
    return sums;
}

// split in half, sort one side, binary search the partner of every left sum
long long closestSubsetSum(const vector<int>& nums, long long goal) {
    size_t half = nums.size() / 2;
    vector<long long> left = subsetSums(nums, 0, half), right = subsetSums(nums, half, nums.size());
    sort(right.begin(), right.end());
    long long best = llabs(goal);                                // the empty subset
    for (long long s : left) {
        auto it = lower_bound(right.begin(), right.end(), goal - s);
        if (it != right.end()) best = min(best, llabs(s + *it - goal));
        if (it != right.begin()) best = min(best, llabs(s + *prev(it) - goal));   // check both neighbours
    }
    return best;
}
// @test
    H::check(closestSubsetSum({5, -7, 3, 5}, 6), 0LL, "exact");
    H::check(closestSubsetSum({7, -9, 15, -2}, -5), 1LL, "off by one");
    H::check(closestSubsetSum({1, 2, 3}, -7), 7LL, "empty subset is best");
    H::check(closestSubsetSum({3, 9, 7, 2, 5, 8}, 20), 0LL, "viz example");
    vector<int> big(40);
    for (int i = 0; i < 40; i++) big[i] = (i * 7919) % 1000 + 1;
    H::check(closestSubsetSum(big, 1), 0LL, "n = 40 runs fast");
