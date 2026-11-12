// frog: least total cost to reach the last stone, jumping 1 or 2
int solve(vector<int> h) {
    int n = h.size();
    vector<int> best(n, 0);
    for (int i = 1; i < n; i++) {
        best[i] = best[i - 1] + abs(h[i] - h[i - 1]);
        if (i > 1) best[i] = min(best[i], best[i - 2] + abs(h[i] - h[i - 2]));
    }
    return best[n - 1];
}
