class Solution {
public:
    int findIntegers(int n) {
        int fib[32] = {1, 2};                 // fib[k] = k-bit strings with no two adjacent 1s
        for (int k = 2; k < 32; k++) fib[k] = fib[k - 1] + fib[k - 2];
        int total = 0;
        bool prev = false;
        for (int b = 30; b >= 0; b--) {
            if (!(n >> b & 1)) { prev = false; continue; }
            total += fib[b];                  // a 0 here leaves b free bits
            if (prev) return total;
            prev = true;
        }
        return total + 1;
    }
};
