// length of the longest proper prefix that is also a suffix (prefix function)
int solve(string s) {
    vector<int> pi(s.size(), 0);
    for (size_t i = 1; i < s.size(); i++) {
        int j = pi[i - 1];
        while (j && s[i] != s[j]) j = pi[j - 1];
        if (s[i] == s[j]) j++;
        pi[i] = j;
    }
    return pi.back();
}
