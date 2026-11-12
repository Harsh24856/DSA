// sorted input: if the sum is too small only L can grow it, if too big only R can shrink it
vector<int> twoSumSorted(const vector<int>& a, int target) {
    int L = 0, R = (int)a.size() - 1;
    while (L < R) {
        long long s = (long long)a[L] + a[R];   // long long: two ints can overflow
        if (s == target) return {L, R};
        if (s < target) L++;
        else R--;
    }
    return {};
}
// @test
    H::check(twoSumSorted({1, 2, 4, 6, 8, 11, 15}, 14), vector<int>{3, 4}, "pair 6 + 8");
    H::check(twoSumSorted({2, 7, 11, 15}, 9), vector<int>{0, 1}, "first two");
    H::check(twoSumSorted({1, 2, 3}, 7), vector<int>{}, "no pair");
    H::check(twoSumSorted({}, 1), vector<int>{}, "empty");
