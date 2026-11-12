// Manacher: p[i] = palindrome radius around t[i] in t = ^#a#b#...#$, which equals the length in s
vector<int> radii(const string& s) {
    string t = "^#";
    for (char c : s) { t += c; t += '#'; }
    t += '$';                                             // ^ and $ differ, so expansion stops at the ends
    int n = t.size(), c = 0, r = 0;                       // c, r: centre and right edge of the rightmost palindrome
    vector<int> p(n, 0);
    for (int i = 1; i < n - 1; i++) {
        if (i < r) p[i] = min(r - i, p[2 * c - i]);       // the mirror around c already knows a lower bound
        while (t[i + p[i] + 1] == t[i - p[i] - 1]) p[i]++;
        if (i + p[i] > r) { c = i; r = i + p[i]; }
    }
    return p;
}

string longestPal(const string& s) {
    vector<int> p = radii(s);
    int k = max_element(p.begin(), p.end()) - p.begin();
    return s.substr((k - p[k]) / 2, p[k]);
}

long long countPal(const string& s) {                    // every palindromic substring, by centre
    long long total = 0;
    for (int x : radii(s)) total += (x + 1) / 2;
    return total;
}
// @test
    H::check(longestPal("babad"), string("bab"), "babad");
    H::check(longestPal("cbbd"), string("bb"), "even");
    H::check(longestPal("forgeeksskeegfor"), string("geeksskeeg"), "long even");
    H::check(longestPal("a"), string("a"), "one");
    H::check(longestPal(""), string(""), "empty");
    H::check(countPal("abc"), 3LL, "count abc");
    H::check(countPal("aaa"), 6LL, "count aaa");
    H::check(radii("aba"), vector<int>{0, 0, 1, 0, 3, 0, 1, 0, 0}, "radii of aba");
