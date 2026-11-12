class Solution {
public:
    bool validPalindrome(string s) {
        auto isPal = [&](int l, int r) {
            while (l < r) if (s[l++] != s[r--]) return false;
            return true;
        };
        int l = 0, r = (int)s.size() - 1;
        while (l < r) {
            if (s[l] != s[r]) return isPal(l + 1, r) || isPal(l, r - 1);   // one deletion: skip either side
            l++; r--;
        }
        return true;
    }
};
