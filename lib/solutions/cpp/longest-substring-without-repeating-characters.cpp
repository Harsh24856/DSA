class Solution {
public:
    int lengthOfLongestSubstring(string s) {
        unordered_map<char, int> last;                     // last index of each character
        int l = 0, best = 0;
        for (int r = 0; r < (int)s.size(); r++) {
            auto it = last.find(s[r]);
            if (it != last.end() && it->second >= l) l = it->second + 1;   // jump past the repeat
            last[s[r]] = r;
            best = max(best, r - l + 1);
        }
        return best;
    }
};
