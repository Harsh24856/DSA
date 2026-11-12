// longest window with sum at most s
int solve(vector<int> a, long long s) {
    int best = 0, l = 0;
    long long total = 0;
    for (int r = 0; r < (int)a.size(); r++) {
        total += a[r];
        while (total > s) total -= a[l++];                 // shrink from the left
        best = max(best, r - l + 1);
    }
    return best;
}
