class Solution {
public:
    int minCut(string s) {
        int n = s.size();
        vector<int> cut(n + 1);                          // cut[i]: fewest cuts for s[0..i), with cut[0] = -1
        iota(cut.begin(), cut.end(), -1);
        for (int c = 0; c < n; c++)
            for (auto [l, r] : {pair{c, c}, pair{c, c + 1}})   // grow each palindrome from its centre
                while (l >= 0 && r < n && s[l] == s[r]) {
                    cut[r + 1] = min(cut[r + 1], cut[l] + 1);
                    l--; r++;
                }
        return cut[n];
    }
};
