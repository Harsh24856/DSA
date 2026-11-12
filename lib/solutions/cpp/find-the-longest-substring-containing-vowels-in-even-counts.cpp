class Solution {
public:
    int findTheLongestSubstring(string s) {
        const string vowels = "aeiou";
        vector<int> first(32, -2);   // parity mask -> first index, -2 = not seen
        first[0] = -1;
        int mask = 0, best = 0;
        for (int i = 0; i < (int)s.size(); i++) {
            auto p = vowels.find(s[i]);
            if (p != string::npos) mask ^= 1 << p;
            if (first[mask] != -2) best = max(best, i - first[mask]);   // same parity: even counts between
            else first[mask] = i;
        }
        return best;
    }
};
