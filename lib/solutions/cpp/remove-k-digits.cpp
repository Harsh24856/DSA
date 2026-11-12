class Solution {
public:
    string removeKdigits(string num, int k) {
        string st;                                     // digits kept, never falling
        for (char d : num) {
            while (k && !st.empty() && st.back() > d) { st.pop_back(); k--; }
            st.push_back(d);
        }
        st.resize(st.size() - k);                      // still owed removals come off the end
        size_t start = st.find_first_not_of('0');
        return start == string::npos ? "0" : st.substr(start);
    }
};
