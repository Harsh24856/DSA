// is there a non-empty subset of a that sums to target?
string solve(vector<int> a, int target) {
    int n = a.size();
    for (int mask = 1; mask < (1 << n); mask++) {          // each mask is one subset
        long long total = 0;
        for (int i = 0; i < n; i++)
            if (mask >> i & 1) total += a[i];
        if (total == target) return "YES";
    }
    return "NO";
}
