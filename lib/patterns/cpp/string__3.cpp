// anagrams of p inside s: slide a window of len(p), keep 26 counts, compare with p's counts
vector<int> findAnagrams(const string& s, const string& p) {
    int m = p.size();
    if (m > (int)s.size()) return {};
    array<int, 26> need{}, win{};
    for (char c : p) need[c - 'a']++;
    vector<int> out;
    for (int i = 0; i < (int)s.size(); i++) {
        win[s[i] - 'a']++;
        if (i >= m) win[s[i - m] - 'a']--;              // the char that just left the window
        if (win == need) out.push_back(i - m + 1);      // 26 comparisons: constant work
    }
    return out;
}
// @test
    H::check(findAnagrams("cbaebabacd", "abc"), vector<int>{0, 6}, "classic");
    H::check(findAnagrams("abab", "ab"), vector<int>{0, 1, 2}, "overlapping");
    H::check(findAnagrams("a", "ab"), vector<int>{}, "pattern longer");
