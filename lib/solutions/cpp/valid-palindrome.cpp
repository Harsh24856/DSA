class Solution {
public:
    bool isPalindrome(string s) {
        int l = 0, r = (int)s.size() - 1;
        while (l < r) {
            if (!isalnum((unsigned char)s[l])) l++;
            else if (!isalnum((unsigned char)s[r])) r--;
            else if (tolower((unsigned char)s[l]) != tolower((unsigned char)s[r])) return false;
            else { l++; r--; }
        }
        return true;
    }
};
