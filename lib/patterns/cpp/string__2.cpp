// minimum window containing every char of t: grow R, and while the window is complete, record it and shrink L
string minWindow(const string& s, const string& t) {
    if (t.empty()) return "";
    array<int, 128> need{}, win{};
    int kinds = 0;                                      // distinct chars t needs
    for (unsigned char c : t) if (need[c]++ == 0) kinds++;
    int have = 0, bestLen = INT_MAX, bestL = 0;         // have = distinct chars whose count is met
    for (int L = 0, R = 0; R < (int)s.size(); R++) {
        unsigned char c = s[R];
        if (++win[c] == need[c]) have++;                // met exactly now, so it is counted once
        while (have == kinds) {
            if (R - L + 1 < bestLen) { bestLen = R - L + 1; bestL = L; }
            unsigned char d = s[L++];
            if (win[d]-- == need[d]) have--;            // drops below what t needs
        }
    }
    return bestLen == INT_MAX ? "" : s.substr(bestL, bestLen);
}
// @test
    H::check(minWindow("ADOBECODEBANC", "ABC"), string("BANC"), "classic");
    H::check(minWindow("a", "a"), string("a"), "single");
    H::check(minWindow("a", "aa"), string(""), "needs two a's");
    H::check(minWindow("aaflslflsldkalskaaa", "aaa"), string("aaa"), "repeated need");
