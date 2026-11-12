class Solution {
public:
    string reverseParentheses(string s) {
        vector<string> st{""};                         // text built at each open depth
        for (char ch : s) {
            if (ch == '(') st.push_back("");
            else if (ch == ')') {
                string top = st.back(); st.pop_back();
                st.back() += string(top.rbegin(), top.rend());   // closing a pair reverses its text
            } else {
                st.back() += ch;
            }
        }
        return st[0];
    }
};
