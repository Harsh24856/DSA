class Solution {
public:
    string removeOccurrences(string s, string part) {
        string st;   // the string works as a stack
        size_t m = part.size();
        for (char c : s) {
            st.push_back(c);
            if (st.size() >= m && st.compare(st.size() - m, m, part) == 0)
                st.resize(st.size() - m);   // the top m chars spell part: drop them
        }
        return st;
    }
};
