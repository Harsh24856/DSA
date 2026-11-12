class Solution {
public:
    string smallestSubsequence(string s) {
        int last[26];
        for (int i = 0; i < (int)s.size(); i++) last[s[i] - 'a'] = i;
        string st;
        bool inside[26] = {};
        for (int i = 0; i < (int)s.size(); i++) {
            char c = s[i];
            if (inside[c - 'a']) continue;
            while (!st.empty() && st.back() > c && last[st.back() - 'a'] > i) {   // it comes again later
                inside[st.back() - 'a'] = false;
                st.pop_back();
            }
            st.push_back(c);
            inside[c - 'a'] = true;
        }
        return st;
    }
};
