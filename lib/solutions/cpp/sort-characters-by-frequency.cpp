class Solution {
public:
    string frequencySort(string s) {
        unordered_map<char, int> cnt;
        for (char c : s) cnt[c]++;
        vector<pair<int, char>> order;
        for (auto [c, k] : cnt) order.push_back({k, c});
        sort(order.rbegin(), order.rend());   // most common first
        string out;
        for (auto [k, c] : order) out.append(k, c);
        return out;
    }
};
// @test
    for (auto [s, ok] : vector<pair<string, vector<string>>>{{"tree", {"eert", "eetr"}}, {"cccaaa", {"cccaaa", "aaaccc"}}, {"Aabb", {"bbAa", "bbaA"}}}) {
        string got = Solution().frequencySort(s);
        H::check(find(ok.begin(), ok.end(), got) != ok.end(), true, "frequencySort " + s + " -> " + got);
    }
