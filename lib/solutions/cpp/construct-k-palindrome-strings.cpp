class Solution {
public:
    bool canConstruct(string s, int k) {
        int cnt[26] = {};
        for (char c : s) cnt[c - 'a']++;
        int odd = 0;
        for (int v : cnt) odd += v % 2;   // each odd count needs its own palindrome centre
        return odd <= k && k <= (int)s.size();
    }
};
