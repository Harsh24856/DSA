class Solution {
public:
    int totalStrength(vector<int>& strength) {
        const long long MOD = 1'000'000'007;
        int n = strength.size();
        vector<int> left(n, -1), right(n, n), st;
        for (int i = 0; i < n; i++) {
            while (!st.empty() && strength[st.back()] >= strength[i]) { right[st.back()] = i; st.pop_back(); }
            left[i] = st.empty() ? -1 : st.back();
            st.push_back(i);
        }
        vector<long long> P{0}, PP{0};                     // prefix sums and prefix of prefix sums, mod MOD
        for (int x : strength) P.push_back((P.back() + x) % MOD);
        for (long long p : P) PP.push_back((PP.back() + p) % MOD);
        long long ans = 0;
        for (int i = 0; i < n; i++) {
            long long L = left[i], R = right[i];
            long long total = ((i - L) * ((PP[R + 1] - PP[i + 1] + MOD) % MOD) % MOD
                             - (R - i) * ((PP[i + 1] - PP[L + 1] + MOD) % MOD) % MOD + MOD) % MOD;
            ans = (ans + strength[i] * total) % MOD;
        }
        return ans;
    }
};
