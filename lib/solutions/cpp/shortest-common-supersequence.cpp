class Solution {
public:
    string shortestCommonSupersequence(string str1, string str2) {
        int m = str1.size(), n = str2.size();
        vector<vector<int>> dp(m + 1, vector<int>(n + 1, 0));   // LCS table
        for (int i = 0; i < m; i++)
            for (int j = 0; j < n; j++)
                dp[i + 1][j + 1] = str1[i] == str2[j] ? dp[i][j] + 1 : max(dp[i][j + 1], dp[i + 1][j]);
        string out;
        int i = m, j = n;
        while (i && j) {                                     // walk back, writing each char once
            if (str1[i - 1] == str2[j - 1]) { out += str1[i - 1]; i--; j--; }
            else if (dp[i - 1][j] >= dp[i][j - 1]) out += str1[--i];
            else out += str2[--j];
        }
        while (i) out += str1[--i];                          // leftovers of either string
        while (j) out += str2[--j];
        reverse(out.begin(), out.end());
        return out;
    }
};
// @test
    auto sub = [](const string& a, const string& b) {        // is a a subsequence of b
        size_t k = 0;
        for (char ch : b) if (k < a.size() && a[k] == ch) k++;
        return k == a.size();
    };
    for (auto [a, b, size] : vector<tuple<string, string, int>>{{"abac", "cab", 5}, {"aaaaaaaa", "aaaaaaaa", 8}, {"abc", "def", 6}}) {
        string got = Solution().shortestCommonSupersequence(a, b);
        H::check((int)got.size(), size, "scs size " + a + " " + b);
        H::check(sub(a, got) && sub(b, got), true, "scs holds both " + a + " " + b);
    }
