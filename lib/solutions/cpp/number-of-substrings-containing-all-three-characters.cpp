class Solution {
public:
    int numberOfSubstrings(string s) {
        int last[3] = {-1, -1, -1};   // latest index of a, b, c
        int ans = 0;
        for (int i = 0; i < (int)s.size(); i++) {
            last[s[i] - 'a'] = i;
            ans += min({last[0], last[1], last[2]}) + 1;   // starts that still include all three
        }
        return ans;
    }
};
