class Solution {
public:
    string customSortString(string order, string s) {
        int cnt[26] = {};
        for (char c : s) cnt[c - 'a']++;
        string out;
        for (char c : order) { out.append(cnt[c - 'a'], c); cnt[c - 'a'] = 0; }   // ordered letters first
        for (int i = 0; i < 26; i++) out.append(cnt[i], 'a' + i);                // then the rest
        return out;
    }
};
