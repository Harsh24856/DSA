// Z-function: z[i] = length of the longest common prefix of s and s[i..]
vector<int> zFunction(const string& s) {
    int n = s.size();
    vector<int> z(n, 0);
    for (int i = 1, l = 0, r = 0; i < n; i++) {        // [l, r) = rightmost window known to equal a prefix
        if (i < r) z[i] = min(r - i, z[i - l]);         // reuse the mirror inside the window
        while (i + z[i] < n && s[z[i]] == s[i + z[i]]) z[i]++;
        if (i + z[i] > r) { l = i; r = i + z[i]; }
    }
    if (n) z[0] = n;
    return z;
}

// every start of p in text: z on p + separator + text, where z == len(p)
vector<int> findAll(const string& text, const string& p) {
    string s = p + '\0' + text;                          // '\0' appears in neither string
    vector<int> z = zFunction(s), out;
    int m = p.size();
    for (int i = m + 1; i < (int)s.size(); i++)
        if (z[i] == m) out.push_back(i - m - 1);
    return out;
}
// @test
    H::check(zFunction("aabxaab"), vector<int>{7, 1, 0, 0, 3, 1, 0}, "z of aabxaab");
    H::check(zFunction("aaaaa"), vector<int>{5, 4, 3, 2, 1}, "all equal");
    H::check(findAll("abababa", "aba"), vector<int>{0, 2, 4}, "overlapping matches");
    H::check(findAll("hello", "xyz"), vector<int>{}, "no match");
    H::check(zFunction(""), vector<int>{}, "empty");
