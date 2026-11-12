class Solution {
    // index of the next kept character at or before i, or -1
    int next(const string& x, int i) {
        int skip = 0;
        for (; i >= 0; i--) {
            if (x[i] == '#') skip++;
            else if (skip) skip--;
            else break;
        }
        return i;
    }

public:
    bool backspaceCompare(string s, string t) {
        int i = s.size() - 1, j = t.size() - 1;
        while (true) {                                   // walk both from the end, one kept character at a time
            i = next(s, i); j = next(t, j);
            if (i < 0 || j < 0) return i < 0 && j < 0;
            if (s[i] != t[j]) return false;
            i--; j--;
        }
    }
};
