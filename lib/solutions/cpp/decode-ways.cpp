class Solution {
public:
    int numDecodings(string s) {
        int prev = 1, cur = s[0] != '0';                     // ways up to i-2 and i-1
        for (size_t i = 1; i < s.size(); i++) {
            int nxt = 0;
            if (s[i] != '0') nxt += cur;                     // one-digit code
            int two = (s[i - 1] - '0') * 10 + (s[i] - '0');
            if (10 <= two && two <= 26) nxt += prev;         // two-digit code
            prev = cur;
            cur = nxt;
        }
        return cur;
    }
};
