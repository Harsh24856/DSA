class Solution {
public:
    int numSub(string s) {
        const long long MOD = 1'000'000'007;
        long long run = 0, total = 0;
        for (char ch : s) {
            run = ch == '1' ? run + 1 : 0;
            total += run;            // substrings of ones ending here
        }
        return total % MOD;
    }
};
