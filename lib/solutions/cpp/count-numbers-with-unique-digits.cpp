class Solution {
public:
    int countNumbersWithUniqueDigits(int n) {
        int total = 1, ways = 9;
        for (int L = 1; L <= n; L++) {
            total += ways;
            ways *= 10 - L;
        }
        return total;
    }
};
