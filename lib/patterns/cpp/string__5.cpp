// KMP: lps[i] = longest proper prefix of p[0..i] that is also a suffix; on a mismatch j falls back to lps[j - 1]
int kmpFind(const string& text, const string& p) {
    if (p.empty()) return 0;
    int m = p.size();
    vector<int> lps(m, 0);
    for (int i = 1, k = 0; i < m; i++) {
        while (k && p[i] != p[k]) k = lps[k - 1];
        if (p[i] == p[k]) k++;
        lps[i] = k;
    }
    for (int i = 0, j = 0; i < (int)text.size(); i++) {   // i never moves backward
        while (j && text[i] != p[j]) j = lps[j - 1];
        if (text[i] == p[j]) j++;
        if (j == m) return i - m + 1;
    }
    return -1;
}
// @test
    H::check(kmpFind("sadbutsad", "sad"), 0, "at the start");
    H::check(kmpFind("leetcode", "leeto"), -1, "absent");
    H::check(kmpFind("aabaaabaaac", "aabaaac"), 4, "needs the fallback");
    H::check(kmpFind("abc", "c"), 2, "at the end");
