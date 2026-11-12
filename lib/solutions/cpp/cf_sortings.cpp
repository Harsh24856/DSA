// smallest max - min over any k elements
int solve(vector<int> a, int k) {
    sort(a.begin(), a.end());
    int best = INT_MAX;
    for (size_t i = 0; i + k - 1 < a.size(); i++)          // the best k are neighbours once sorted
        best = min(best, a[i + k - 1] - a[i]);
    return best;
}
