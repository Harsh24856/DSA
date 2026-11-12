class Solution {
public:
    int minAddToMakeValid(string s) {
        int open = 0, add = 0;
        for (char ch : s) {
            if (ch == '(') open++;
            else if (open) open--;
            else add++;            // a ')' with nothing to close
        }
        return add + open;         // plus every '(' left open
    }
};
