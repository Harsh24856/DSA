class Solution {
public:
    string reorganizeString(string s) {
        int cnt[26] = {};
        for (char ch : s) cnt[ch - 'a']++;
        vector<int> order;                               // letters, most frequent first
        for (int c = 0; c < 26; c++) if (cnt[c]) order.push_back(c);
        stable_sort(order.begin(), order.end(), [&](int a, int b) { return cnt[a] > cnt[b]; });
        int n = s.size(), half = (n + 1) / 2;
        if (cnt[order[0]] > half) return "";             // too many of one letter to keep them apart
        string chars;
        for (int c : order) chars += string(cnt[c], 'a' + c);
        string out(n, ' ');
        for (int i = 0; i < n; i++)                      // first half on even slots, the rest on odd ones
            out[i < half ? 2 * i : 2 * (i - half) + 1] = chars[i];
        return out;
    }
};
// @test
    for (string s : {"aab", "aaabbc", "vvvlo", "a"}) {
        string out = Solution().reorganizeString(s);
        bool apart = true;
        for (size_t i = 1; i < out.size(); i++) if (out[i] == out[i - 1]) apart = false;
        H::check(H::sorted(vector<char>(out.begin(), out.end())) == H::sorted(vector<char>(s.begin(), s.end())), true, "reorganizeString letters " + s);
        H::check(apart, true, "reorganizeString apart " + s);
    }
    H::check(Solution().reorganizeString("aaab"), string(""), "reorganizeString aaab");
