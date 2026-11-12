class Solution {
    using u64 = unsigned long long;
    static constexpr u64 MOD = (1ULL << 61) - 1, B = 131;
    static u64 mul(u64 a, u64 b) { return (unsigned __int128)a * b % MOD; }   // 128-bit product, no overflow

    // start of a repeated substring of length L, or -1
    int dup(const string& s, int L) {
        u64 h = 0, p = 1;
        for (int k = 0; k < L; k++) p = mul(p, B);   // B^L, the weight of the char leaving the window
        unordered_map<u64, vector<int>> seen;
        for (int i = 0; i < (int)s.size(); i++) {
            h = (mul(h, B) + (unsigned char)s[i]) % MOD;
            if (i >= L) h = (h + MOD - mul((unsigned char)s[i - L], p)) % MOD;
            if (i >= L - 1) {
                int st = i - L + 1;
                auto& bucket = seen[h];
                for (int j : bucket)
                    if (s.compare(j, L, s, st, L) == 0) return st;   // confirm, hashes can collide
                bucket.push_back(st);
            }
        }
        return -1;
    }

public:
    string longestDupSubstring(string s) {
        int lo = 1, hi = s.size() - 1;
        string best;
        while (lo <= hi) {   // a repeat of length L means one of every shorter length too
            int mid = (lo + hi) / 2, st = dup(s, mid);
            if (st >= 0) { best = s.substr(st, mid); lo = mid + 1; }
            else hi = mid - 1;
        }
        return best;
    }
};
