class Solution {
public:
    int reverse(int x) {
        int sign = x < 0 ? -1 : 1;
        long long v = llabs((long long)x), rev = 0;          // long long: the reverse can overflow int
        while (v) {
            rev = rev * 10 + v % 10;
            v /= 10;
        }
        rev *= sign;
        return rev >= INT_MIN && rev <= INT_MAX ? (int)rev : 0;
    }
};
