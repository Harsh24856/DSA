class Solution {
public:
    bool isValid(string code) {
        vector<string> st;                                 // open tag names
        size_t i = 0, n = code.size();
        while (i < n) {
            if (i > 0 && st.empty()) return false;         // everything must sit inside one closed tag
            if (code.compare(i, 9, "<![CDATA[") == 0) {
                size_t j = code.find("]]>", i + 9);
                if (st.empty() || j == string::npos) return false;
                i = j + 3;                                 // skip the CDATA body untouched
            } else if (code.compare(i, 2, "</") == 0) {
                size_t j = code.find('>', i + 2);
                if (j == string::npos || st.empty() || st.back() != code.substr(i + 2, j - i - 2)) return false;
                st.pop_back();
                i = j + 1;
            } else if (code[i] == '<') {
                size_t j = code.find('>', i + 1);
                if (j == string::npos) return false;
                string name = code.substr(i + 1, j - i - 1);
                bool upper = all_of(name.begin(), name.end(), [](char c) { return c >= 'A' && c <= 'Z'; });
                if (name.size() < 1 || name.size() > 9 || !upper) return false;
                st.push_back(name);
                i = j + 1;
            } else {
                i++;
            }
        }
        return st.empty();
    }
};
