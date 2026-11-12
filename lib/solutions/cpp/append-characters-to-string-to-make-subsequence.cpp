class Solution {
public:
    int appendCharacters(string s, string t) {
        size_t j = 0;   // how much of t is already a subsequence of s
        for (char c : s)
            if (j < t.size() && c == t[j]) j++;
        return t.size() - j;
    }
};
