// at most k swaps of a[i] with b[j] to maximise sum(a)
long long solve(vector<int> a, vector<int> b, int k) {
    sort(a.begin(), a.end());                              // smallest of a
    sort(b.rbegin(), b.rend());                            // against largest of b
    for (int i = 0; i < min(k, (int)a.size()); i++) {
        if (b[i] <= a[i]) break;
        a[i] = b[i];
    }
    return accumulate(a.begin(), a.end(), 0LL);
}
