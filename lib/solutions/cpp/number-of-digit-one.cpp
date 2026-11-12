class Solution {
public:
    int countDigitOne(int n) {
        string s = to_string(n);
        int L = s.size();
        long long total = 0, ones = 0;        // ones = 1s in n's prefix so far
        for (int i = 0; i < L; i++) {
            int d = s[i] - '0', r = L - i - 1;
            long long p = 1;
            for (int t = 0; t < r; t++) p *= 10;
            for (int x = 0; x < d; x++)       // x below n's digit: the last r digits are free
                total += (ones + (x == 1)) * p + r * p / 10;
            ones += d == 1;
        }
        return total + ones;
    }
};
