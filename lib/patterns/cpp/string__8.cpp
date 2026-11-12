// Rabin-Karp: a rolling polynomial hash of each window; confirm every hash hit with a real compare
vector<int> rabinKarp(const string& text, const string& p) {
    const long long B = 256, M = 1'000'000'007;
    int n = text.size(), m = p.size();
    if (m > n) return {};
    long long high = 1, hp = 0, hw = 0;
    for (int i = 0; i + 1 < m; i++) high = high * B % M;     // B^(m-1): weight of the char that leaves
    for (int i = 0; i < m; i++) {
        hp = (hp * B + (unsigned char)p[i]) % M;
        hw = (hw * B + (unsigned char)text[i]) % M;
    }
    vector<int> out;
    for (int i = 0; i + m <= n; i++) {
        if (hw == hp && text.compare(i, m, p) == 0) out.push_back(i);   // hashes can collide
        if (i + m < n) {
            hw = (hw - (unsigned char)text[i] * high % M + M) % M;     // + M: keep it non-negative
            hw = (hw * B + (unsigned char)text[i + m]) % M;
        }
    }
    return out;
}
// @test
    H::check(rabinKarp("abracadabra", "abra"), vector<int>{0, 7}, "abra");
    H::check(rabinKarp("aaaaa", "aa"), vector<int>{0, 1, 2, 3}, "overlapping");
    H::check(rabinKarp("abc", "d"), vector<int>{}, "absent");
    H::check(rabinKarp("ab", "abc"), vector<int>{}, "pattern longer");
    H::check(rabinKarp("xyzxyz", "xyz"), vector<int>{0, 3}, "two");
