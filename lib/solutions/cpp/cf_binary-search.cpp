// smallest time t in which the machines make at least k items
long long solve(vector<int> a, long long k) {
    long long lo = 1, hi = *min_element(a.begin(), a.end()) * k;   // the fastest machine alone is surely enough
    while (lo < hi) {
        long long mid = (lo + hi) / 2, made = 0;
        for (int x : a) made += mid / x;
        if (made >= k) hi = mid;
        else lo = mid + 1;
    }
    return lo;
}
