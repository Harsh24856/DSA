class Solution {
public:
    int numWays(string s) {
        const long long MOD = 1'000'000'007;
        long long n = s.size();
        vector<long long> pos;                            // indexes of the ones
        for (int i = 0; i < n; i++) if (s[i] == '1') pos.push_back(i);
        long long ones = pos.size();
        if (ones % 3) return 0;
        if (ones == 0) return (n - 1) * (n - 2) / 2 % MOD;  // choose 2 of the n - 1 cut positions
        long long t = ones / 3;
        return (pos[t] - pos[t - 1]) * (pos[2 * t] - pos[2 * t - 1]) % MOD;
    }
};
