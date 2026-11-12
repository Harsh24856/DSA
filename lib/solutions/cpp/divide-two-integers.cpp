class Solution {
public:
    int divide(int dividend, int divisor) {
        if (dividend == INT_MIN && divisor == -1) return INT_MAX;   // the only overflow
        bool neg = (dividend < 0) != (divisor < 0);
        long long a = llabs((long long)dividend), b = llabs((long long)divisor), q = 0;
        while (a >= b) {
            long long t = b, m = 1;
            while (a >= t << 1) { t <<= 1; m <<= 1; }        // biggest doubling of b that fits
            a -= t;
            q += m;
        }
        return (int)(neg ? -q : q);
    }
};
