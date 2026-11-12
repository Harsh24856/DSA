class Solution {
public:
    string removeDuplicateLetters(string s) {
        int last[26];
        for (int i = 0; i < (int)s.size(); i++) last[s[i] - 'a'] = i;
        string st;
        bool used[26] = {};
        for (int i = 0; i < (int)s.size(); i++) {
            char c = s[i];
            if (used[c - 'a']) continue;
            // pop a bigger letter if it appears again later
            while (!st.empty() && c < st.back() && last[st.back() - 'a'] > i) {
                used[st.back() - 'a'] = false;
                st.pop_back();
            }
            st.push_back(c);
            used[c - 'a'] = true;
        }
        return st;
    }
};
