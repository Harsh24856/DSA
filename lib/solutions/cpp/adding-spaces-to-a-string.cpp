class Solution {
public:
    string addSpaces(string s, vector<int>& spaces) {
        string out;
        out.reserve(s.size() + spaces.size());
        size_t j = 0;
        for (int i = 0; i < (int)s.size(); i++) {
            if (j < spaces.size() && spaces[j] == i) {   // a space goes before s[i]
                out += ' ';
                j++;
            }
            out += s[i];
        }
        return out;
    }
};
