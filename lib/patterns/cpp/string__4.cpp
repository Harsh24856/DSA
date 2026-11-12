// expand around all 2n - 1 centres: centre c covers s[c/2] (odd) or the gap after it (even)
string longestPal(const string& s) {
    int n = s.size(), bestL = 0, bestR = -1;
    for (int c = 0; c < 2 * n - 1; c++) {
        int L = c / 2, R = (c + 1) / 2;
        while (L >= 0 && R < n && s[L] == s[R]) {
            if (R - L > bestR - bestL) { bestL = L; bestR = R; }
            L--; R++;
        }
    }
    return s.substr(bestL, bestR - bestL + 1);
}
// @test
    H::check(longestPal("babad"), string("bab"), "babad");
    H::check(longestPal("cbbd"), string("bb"), "even centre");
    H::check(longestPal("a"), string("a"), "one char");
    H::check(longestPal("forgeeksskeegfor"), string("geeksskeeg"), "long even");
    H::check(longestPal(""), string(""), "empty");
