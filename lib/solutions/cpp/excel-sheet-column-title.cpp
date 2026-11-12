class Solution {
public:
    string convertToTitle(int columnNumber) {
        int n = columnNumber;
        string out;
        while (n) {
            n--;                                             // shift 1..26 down to 0..25
            out.push_back('A' + n % 26);
            n /= 26;
        }
        reverse(out.begin(), out.end());
        return out;
    }
};
