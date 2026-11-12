// a permutation of 1..n where neighbours differ by at least 2, or [-1]
vector<int> solve(int n) {
    if (n == 1) return {1};
    if (n < 4) return {-1};
    vector<int> out;
    for (int x = 2; x <= n; x += 2) out.push_back(x);      // evens first, then odds
    for (int x = 1; x <= n; x += 2) out.push_back(x);
    return out;
}
