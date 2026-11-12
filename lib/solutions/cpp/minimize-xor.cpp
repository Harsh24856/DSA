class Solution {
public:
    int minimizeXor(int num1, int num2) {
        int need = __builtin_popcount(num2), x = 0;
        for (int b = 30; b >= 0 && need; b--)          // cancel num1's high bits first
            if (num1 >> b & 1) { x |= 1 << b; need--; }
        for (int b = 0; b <= 30 && need; b++)          // then fill the lowest free bits
            if (!(x >> b & 1)) { x |= 1 << b; need--; }
        return x;
    }
};
