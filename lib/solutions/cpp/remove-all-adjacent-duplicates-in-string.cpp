class Solution {
public:
    string removeDuplicates(string s) {
        string st;                       // the string itself works as the stack
        for (char ch : s) {
            if (!st.empty() && st.back() == ch) st.pop_back();   // ch cancels the letter before it
            else st.push_back(ch);
        }
        return st;
    }
};
