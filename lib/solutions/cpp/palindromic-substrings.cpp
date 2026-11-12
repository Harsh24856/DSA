class Solution {
public:
    int countSubstrings(string s) {
        int count = 0, n = s.size();
        for (int c = 0; c < 2 * n - 1; c++) {       // 2n - 1 centres: on a letter or between two
            int l = c / 2, r = c / 2 + c % 2;
            while (l >= 0 && r < n && s[l] == s[r]) {
                count++;
                l--; r++;
            }
        }
        return count;
    }
};
