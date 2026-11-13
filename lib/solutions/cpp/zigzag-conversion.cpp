class Solution {
public:
    string convert(string s, int numRows) {
        if (numRows == 1 || numRows >= (int)s.size()) return s;
        vector<string> rows(numRows);
        int r = 0, step = 1;
        for (char ch : s) {
            rows[r] += ch;
            if (r == 0) step = 1;                         // bounce at the top and bottom rows
            else if (r == numRows - 1) step = -1;
            r += step;
        }
        string out;
        for (auto& row : rows) out += row;
        return out;
    }
};
