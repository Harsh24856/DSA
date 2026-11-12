class Solution {
public:
    int beautySum(string s) {
        int total = 0;
        for (int i = 0; i < (int)s.size(); i++) {
            int cnt[26] = {};
            for (int j = i; j < (int)s.size(); j++) {
                cnt[s[j] - 'a']++;
                int hi = 0, lo = INT_MAX;
                for (int c : cnt)
                    if (c) { hi = max(hi, c); lo = min(lo, c); }   // min over letters that appear
                total += hi - lo;
            }
        }
        return total;
    }
};
