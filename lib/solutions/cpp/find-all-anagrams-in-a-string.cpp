class Solution {
public:
    vector<int> findAnagrams(string s, string p) {
        int k = p.size();
        array<int, 26> need{}, win{};
        for (char ch : p) need[ch - 'a']++;
        vector<int> out;
        for (int i = 0; i < (int)s.size(); i++) {
            win[s[i] - 'a']++;
            if (i >= k) win[s[i - k] - 'a']--;           // slide the window of length k
            if (win == need) out.push_back(i - k + 1);
        }
        return out;
    }
};
