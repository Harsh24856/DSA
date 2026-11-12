class Solution {
public:
    string decodeAtIndex(string s, int k) {
        long long size = 0;
        int i = 0;
        // decoded length, stopping once it reaches k (the full length can pass 2^63)
        for (; i < (int)s.size(); i++) {
            size = isdigit(s[i]) ? size * (s[i] - '0') : size + 1;
            if (size >= k) break;
        }
        for (; i >= 0; i--) {                 // walk back, folding k into the shorter string
            char ch = s[i];
            k %= size;
            if (k == 0 && isalpha(ch)) return string(1, ch);
            size = isdigit(ch) ? size / (ch - '0') : size - 1;
        }
        return "";
    }
};
