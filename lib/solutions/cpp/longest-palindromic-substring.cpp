class Solution {
public:
    string longestPalindrome(string s) {
        int n = s.size(), bestL = 0, bestLen = 0;
        for (int c = 0; c < n; c++)
            for (auto [l, r] : {pair{c, c}, pair{c, c + 1}}) {   // odd and even centres
                while (l >= 0 && r < n && s[l] == s[r]) { l--; r++; }
                if (r - l - 1 > bestLen) { bestLen = r - l - 1; bestL = l + 1; }
            }
        return s.substr(bestL, bestLen);
    }
};
