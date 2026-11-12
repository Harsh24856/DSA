class Solution {
public:
    bool repeatedSubstringPattern(string s) {
        string doubled = s + s;
        // drop the first and last char so s cannot match at the trivial positions
        return doubled.substr(1, doubled.size() - 2).find(s) != string::npos;
    }
};
