class Solution {
public:
    double myPow(double x, int n) {
        long long e = n;                                     // -INT_MIN does not fit in int
        if (e < 0) { x = 1 / x; e = -e; }
        double res = 1.0;
        while (e) {                                          // square and multiply
            if (e & 1) res *= x;
            x *= x;
            e >>= 1;
        }
        return res;
    }
};
