// Kadane: run = best sum of a subarray that ends exactly here; a negative carry only hurts, so restart
int maxSubarray(const vector<int>& a) {
    int run = a[0], best = a[0];               // start from a[0], not 0, so all-negative input works
    for (size_t i = 1; i < a.size(); i++) {
        run = max(a[i], run + a[i]);
        best = max(best, run);
    }
    return best;
}
// @test
    H::check(maxSubarray({-2, 1, -3, 4, -1, 2, 1, -5, 4}), 6, "classic");
    H::check(maxSubarray({-3, -1, -2}), -1, "all negative");
    H::check(maxSubarray({5, 4, -1, 7, 8}), 23, "whole array");
    H::check(maxSubarray({7}), 7, "one element");
