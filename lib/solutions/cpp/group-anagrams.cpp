class Solution {
public:
    vector<vector<string>> groupAnagrams(vector<string>& strs) {
        unordered_map<string, vector<string>> groups;    // sorted letters is the key
        for (auto& w : strs) {
            string key = w;
            sort(key.begin(), key.end());
            groups[key].push_back(w);
        }
        vector<vector<string>> out;
        for (auto& [key, g] : groups) out.push_back(g);
        return out;
    }
};
// @test
    auto norm = [](vector<vector<string>> g) {
        for (auto& x : g) sort(x.begin(), x.end());
        sort(g.begin(), g.end());
        return g;
    };
    vector<string> a = {"eat", "tea", "tan", "ate", "nat", "bat"};
    H::check(norm(Solution().groupAnagrams(a)), norm({{"bat"}, {"nat", "tan"}, {"ate", "eat", "tea"}}), "groupAnagrams");
    vector<string> b = {""};
    H::check(Solution().groupAnagrams(b), vector<vector<string>>{{""}}, "groupAnagrams empty");
    vector<string> c = {"a"};
    H::check(Solution().groupAnagrams(c), vector<vector<string>>{{"a"}}, "groupAnagrams one");
