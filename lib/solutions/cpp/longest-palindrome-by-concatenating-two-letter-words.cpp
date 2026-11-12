class Solution {
public:
    int longestPalindrome(vector<string>& words) {
        unordered_map<string, int> cnt;
        for (auto& w : words) cnt[w]++;
        int ans = 0;
        bool center = false;
        for (auto& [w, k] : cnt) {
            if (w[0] == w[1]) {
                ans += k / 2 * 4;          // pairs of "gg" go on both sides
                if (k % 2) center = true;  // one left over can sit in the middle
            } else {
                string r(w.rbegin(), w.rend());
                if (w < r && cnt.count(r)) ans += min(k, cnt[r]) * 4;
            }
        }
        return ans + (center ? 2 : 0);
    }
};
