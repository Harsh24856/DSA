class Solution {
public:
    int titleToNumber(string columnTitle) {
        long long n = 0;
        for (char ch : columnTitle) n = n * 26 + (ch - 'A' + 1);   // base 26 with digits 1 to 26
        return (int)n;
    }
};
