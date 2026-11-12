class Solution {
    static bool isPal(const string& s) { return equal(s.begin(), s.begin() + s.size() / 2, s.rbegin()); }

public:
    vector<vector<int>> palindromePairs(vector<string>& words) {
        unordered_map<string, int> idx;   // reversed word -> its index
        for (int i = 0; i < (int)words.size(); i++) idx[string(words[i].rbegin(), words[i].rend())] = i;
        vector<vector<int>> out;
        for (int i = 0; i < (int)words.size(); i++) {
            const string& w = words[i];
            for (int k = 0; k <= (int)w.size(); k++) {
                string pre = w.substr(0, k), suf = w.substr(k);
                // palindrome prefix: put the reverse of the suffix in front
                if (isPal(pre)) {
                    auto it = idx.find(suf);
                    if (it != idx.end() && it->second != i) out.push_back({it->second, i});
                }
                // palindrome suffix: put the reverse of the prefix after (k < len avoids counting a pair twice)
                if (k != (int)w.size() && isPal(suf)) {
                    auto it = idx.find(pre);
                    if (it != idx.end() && it->second != i) out.push_back({i, it->second});
                }
            }
        }
        return out;
    }
};
// @test
    vector<string> a{"abcd", "dcba", "lls", "s", "sssll"}, b{"bat", "tab", "cat"}, c{"a", ""};
    H::check(H::sorted(Solution().palindromePairs(a)), vector<vector<int>>{{0, 1}, {1, 0}, {2, 4}, {3, 2}}, "a");
    H::check(H::sorted(Solution().palindromePairs(b)), vector<vector<int>>{{0, 1}, {1, 0}}, "b");
    H::check(H::sorted(Solution().palindromePairs(c)), vector<vector<int>>{{0, 1}, {1, 0}}, "c");
