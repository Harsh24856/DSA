class Solution {
public:
    int characterReplacement(string s, int k) {
        int count[26] = {};
        int best = 0, maxf = 0, l = 0;
        for (int r = 0; r < (int)s.size(); r++) {
            maxf = max(maxf, ++count[s[r] - 'A']);
            if (r - l + 1 - maxf > k) { count[s[l] - 'A']--; l++; }   // too many to replace: slide
            best = max(best, r - l + 1);
        }
        return best;
    }
};
