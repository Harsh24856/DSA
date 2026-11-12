class Solution {
public:
    string shortestPalindrome(string s) {
        string t = s + "#" + string(s.rbegin(), s.rend());
        vector<int> lps(t.size(), 0);   // KMP prefix function
        for (size_t i = 1; i < t.size(); i++) {
            int k = lps[i - 1];
            while (k && t[i] != t[k]) k = lps[k - 1];
            if (t[i] == t[k]) k++;
            lps[i] = k;
        }
        // lps.back() is the longest palindrome prefix of s; mirror the rest in front
        string rest = s.substr(lps.back());
        return string(rest.rbegin(), rest.rend()) + s;
    }
};
