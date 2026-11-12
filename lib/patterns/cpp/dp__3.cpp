// tails[k] = smallest tail of an increasing subsequence of length k + 1
int lis(const vector<int>& a) {
    vector<int> tails;
    for (int x : a) {
        auto it = lower_bound(tails.begin(), tails.end(), x);   // strictly increasing: lower_bound
        if (it == tails.end()) tails.push_back(x);
        else *it = x;
    }
    return tails.size();
}
// @test
    H::check(lis({10, 9, 2, 5, 3, 7, 101, 18}), 4, "lis");
    H::check(lis({0, 1, 0, 3, 2, 3}), 4, "lis 2");
    H::check(lis({7, 7, 7, 7}), 1, "equal values");
    H::check(lis({}), 0, "empty");
