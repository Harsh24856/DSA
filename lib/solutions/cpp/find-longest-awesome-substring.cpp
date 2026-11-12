class Solution {
public:
    int longestAwesome(string s) {
        vector<int> first(1 << 10, INT_MAX);   // first index where each parity mask appeared
        first[0] = -1;
        int mask = 0, best = 0;
        for (int i = 0; i < (int)s.size(); i++) {
            mask ^= 1 << (s[i] - '0');
            if (first[mask] != INT_MAX) best = max(best, i - first[mask]);   // all counts even
            else first[mask] = i;
            for (int d = 0; d < 10; d++) {                                   // one odd count
                int m = mask ^ (1 << d);
                if (first[m] != INT_MAX) best = max(best, i - first[m]);
            }
        }
        return best;
    }
};
