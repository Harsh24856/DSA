class Solution {
public:
    int atMostNGivenDigitSet(vector<string>& digits, int n) {
        string s = to_string(n);
        int L = s.size(), k = digits.size();
        vector<long long> pw(L + 1, 1);
        for (int i = 1; i <= L; i++) pw[i] = pw[i - 1] * k;
        long long total = 0;
        for (int len = 1; len < L; len++) total += pw[len];   // shorter numbers are all below n
        for (int i = 0; i < L; i++) {
            int below = 0;
            bool inSet = false;
            for (auto& d : digits) {
                below += d[0] < s[i];
                inSet |= d[0] == s[i];
            }
            total += below * pw[L - i - 1];
            if (!inSet) return total;
        }
        return total + 1;
    }
};
