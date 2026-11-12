class Solution {
public:
    bool checkInclusion(string s1, string s2) {
        int k = s1.size();
        if (k > (int)s2.size()) return false;
        array<int, 26> need{}, win{};
        for (int i = 0; i < k; i++) { need[s1[i] - 'a']++; win[s2[i] - 'a']++; }
        for (int i = k; i < (int)s2.size(); i++) {
            if (win == need) return true;
            win[s2[i] - 'a']++;                       // slide: add the new char, drop the old one
            win[s2[i - k] - 'a']--;
        }
        return win == need;
    }
};
