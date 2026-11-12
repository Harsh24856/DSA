class Solution {
public:
    string minWindow(string s, string t) {
        int need[128] = {};
        for (char ch : t) need[(unsigned char)ch]++;
        int missing = t.size(), l = 0, bestL = 0, bestR = -1;
        for (int r = 0; r < (int)s.size(); r++) {
            if (need[(unsigned char)s[r]]-- > 0) missing--;          // this char was still needed
            while (missing == 0) {                                    // window covers t: shrink from the left
                if (bestR < 0 || r - l < bestR - bestL) { bestL = l; bestR = r; }
                if (++need[(unsigned char)s[l]] > 0) missing++;
                l++;
            }
        }
        return bestR < 0 ? "" : s.substr(bestL, bestR - bestL + 1);
    }
};
