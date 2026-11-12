class Solution {
public:
    int getSum(int a, int b) {
        // unsigned so the carry shift never overflows; it wraps like 32-bit hardware
        unsigned x = a, y = b;
        while (y) {
            unsigned carry = (x & y) << 1;
            x ^= y;                                          // sum without carries
            y = carry;
        }
        return (int)x;
    }
};
