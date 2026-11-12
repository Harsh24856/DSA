// longest substring without repeats: last[c] = latest index of c; L jumps past a repeat inside the window
int longestUnique(const string& s) {
    array<int, 256> last;
    last.fill(-1);
    int L = 0, best = 0;
    for (int R = 0; R < (int)s.size(); R++) {
        unsigned char c = s[R];
        if (last[c] >= L) L = last[c] + 1;      // the earlier copy is inside the window: skip past it
        last[c] = R;
        best = max(best, R - L + 1);
    }
    return best;
}
// @test
    H::check(longestUnique("abcabcbb"), 3, "abcabcbb");
    H::check(longestUnique("bbbbb"), 1, "bbbbb");
    H::check(longestUnique("pwwkew"), 3, "pwwkew");
    H::check(longestUnique("abba"), 2, "old copy left of L is ignored");
    H::check(longestUnique(""), 0, "empty");
