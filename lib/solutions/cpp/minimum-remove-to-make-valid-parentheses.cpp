class Solution {
public:
    string minRemoveToMakeValid(string s) {
        vector<bool> drop(s.size(), false);
        vector<int> st;                                // indexes of unmatched '('
        for (int i = 0; i < (int)s.size(); i++) {
            if (s[i] == '(') st.push_back(i);
            else if (s[i] == ')') {
                if (!st.empty()) st.pop_back();
                else drop[i] = true;                   // ')' with nothing to close
            }
        }
        for (int i : st) drop[i] = true;               // '(' never closed
        string out;
        for (int i = 0; i < (int)s.size(); i++) if (!drop[i]) out += s[i];
        return out;
    }
};
