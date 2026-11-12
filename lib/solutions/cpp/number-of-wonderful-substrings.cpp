class Solution {
public:
    long long wonderfulSubstrings(string word) {
        vector<long long> cnt(1024, 0);   // parity mask of a prefix -> how many
        cnt[0] = 1;
        int mask = 0;
        long long ans = 0;
        for (char ch : word) {
            mask ^= 1 << (ch - 'a');
            ans += cnt[mask];                                     // all letters even
            for (int b = 0; b < 10; b++) ans += cnt[mask ^ (1 << b)];   // exactly one odd
            cnt[mask]++;
        }
        return ans;
    }
};
