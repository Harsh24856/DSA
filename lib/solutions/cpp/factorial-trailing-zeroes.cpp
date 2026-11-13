class Solution {
public:
    int trailingZeroes(int n) {
        int count = 0;
        while (n) { n /= 5; count += n; }        // multiples of 5, then 25, then 125, ...
        return count;
    }
};
