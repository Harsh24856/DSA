class Solution {
    static long long perm(int m, int r) {     // ways to fill r positions from m unused digits
        long long out = 1;
        for (int t = 0; t < r; t++) out *= m - t;
        return out;
    }
public:
    int countSpecialNumbers(int n) {
        string s = to_string(n);
        int L = s.size();
        long long total = 0;
        for (int m = 1; m < L; m++) total += 9 * perm(9, m - 1);
        bool used[10] = {};
        for (int i = 0; i < L; i++) {
            int d = s[i] - '0';
            for (int x = i == 0 ? 1 : 0; x < d; x++)
                if (!used[x]) total += perm(9 - i, L - i - 1);
            if (used[d]) return total;
            used[d] = true;
        }
        return total + 1;
    }
};
