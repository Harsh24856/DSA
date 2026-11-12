class Solution {
    int power(int b, int e) {                                // b^e mod 1337, b already below 1337
        int r = 1;
        for (int i = 0; i < e; i++) r = r * b % 1337;
        return r;
    }
public:
    int superPow(int a, vector<int>& b) {
        int res = 1;
        a %= 1337;
        for (int d : b) res = power(res, 10) * power(a, d) % 1337;   // a^(10x+d) = (a^x)^10 * a^d
        return res;
    }
};
