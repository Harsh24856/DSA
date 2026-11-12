class Solution {
public:
    int longestSubstring(string s, int k) {
        if ((int)s.size() < k) return 0;
        int cnt[26] = {};
        for (char c : s) cnt[c - 'a']++;
        for (char c : s)
            if (cnt[c - 'a'] < k) {   // c can never be in the answer: split around it
                int best = 0;
                string part;
                stringstream ss(s);
                while (getline(ss, part, c)) best = max(best, longestSubstring(part, k));
                return best;
            }
        return s.size();
    }
};
