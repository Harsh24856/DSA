class Solution {
public:
    bool isValid(string s) {
        unordered_map<char, char> opener{{')', '('}, {']', '['}, {'}', '{'}};
        vector<char> st;
        for (char ch : s) {
            if (opener.count(ch)) {
                if (st.empty() || st.back() != opener[ch]) return false;   // must close the latest opener
                st.pop_back();
            } else {
                st.push_back(ch);
            }
        }
        return st.empty();
    }
};
