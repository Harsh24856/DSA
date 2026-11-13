class Solution {
public:
    bool checkValidString(string s) {
        int lo = 0, hi = 0;                       // fewest and most open brackets possible
        for (char ch : s) {
            if (ch == '(') { lo++; hi++; }
            else if (ch == ')') { lo--; hi--; }
            else { lo--; hi++; }
            if (hi < 0) return false;
            lo = max(lo, 0);
        }
        return lo == 0;
    }
};
