class Solution {
public:
    int firstUniqChar(string s) {
        int count[26] = {};
        for (char ch : s) count[ch - 'a']++;
        for (int i = 0; i < (int)s.size(); i++)
            if (count[s[i] - 'a'] == 1) return i;
        return -1;
    }
};
