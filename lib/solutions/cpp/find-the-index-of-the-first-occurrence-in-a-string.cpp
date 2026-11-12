class Solution {
public:
    int strStr(string haystack, string needle) {
        int m = needle.size();
        vector<int> lps(m, 0);                           // longest proper prefix that is also a suffix
        for (int i = 1, k = 0; i < m; i++) {
            while (k && needle[i] != needle[k]) k = lps[k - 1];
            if (needle[i] == needle[k]) k++;
            lps[i] = k;
        }
        for (int i = 0, k = 0; i < (int)haystack.size(); i++) {
            while (k && haystack[i] != needle[k]) k = lps[k - 1];   // fall back without moving i
            if (haystack[i] == needle[k]) k++;
            if (k == m) return i - k + 1;
        }
        return -1;
    }
};
