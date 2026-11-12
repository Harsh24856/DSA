class Solution {
public:
    int countGoodSubstrings(string s) {
        int count = 0;
        for (size_t i = 0; i + 2 < s.size(); i++) {      // every window of three
            char a = s[i], b = s[i + 1], c = s[i + 2];
            if (a != b && b != c && a != c) count++;
        }
        return count;
    }
};
