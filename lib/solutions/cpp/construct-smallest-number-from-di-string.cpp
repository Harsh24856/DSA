class Solution {
public:
    string smallestNumber(string pattern) {
        string out, st;
        for (int i = 0; i <= (int)pattern.size(); i++) {
            st.push_back('1' + i);
            if (i == (int)pattern.size() || pattern[i] == 'I') {   // a rise: flush the run reversed
                while (!st.empty()) { out.push_back(st.back()); st.pop_back(); }
            }
        }
        return out;
    }
};
