class Solution {
public:
    int numSplits(string s) {
        int n = s.size();
        vector<int> left(n), right(n + 1, 0);   // distinct letters in s[..i] and in s[i..]
        set<char> seen;
        for (int i = 0; i < n; i++) {
            seen.insert(s[i]);
            left[i] = seen.size();
        }
        seen.clear();
        for (int i = n - 1; i >= 0; i--) {
            seen.insert(s[i]);
            right[i] = seen.size();
        }
        int ans = 0;
        for (int i = 0; i + 1 < n; i++) ans += left[i] == right[i + 1];
        return ans;
    }
};
