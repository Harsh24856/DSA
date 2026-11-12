class Solution {
    vector<array<int, 26>> packs;
    unordered_map<string, int> memo;
    static constexpr int INF = INT_MAX / 2;

    int solve(const string& left) {                      // left is sorted, so equal states share one key
        if (left.empty()) return 0;
        if (auto it = memo.find(left); it != memo.end()) return it->second;
        array<int, 26> need{};
        for (char ch : left) need[ch - 'a']++;
        int best = INF;
        for (auto& p : packs) {
            if (p[left[0] - 'a'] == 0) continue;         // only stickers that cover the first letter
            string rest;
            for (int ch = 0; ch < 26; ch++) rest += string(max(0, need[ch] - p[ch]), 'a' + ch);
            best = min(best, 1 + solve(rest));
        }
        return memo[left] = best;
    }

public:
    int minStickers(vector<string>& stickers, string target) {
        for (auto& s : stickers) {
            array<int, 26> c{};
            for (char ch : s) c[ch - 'a']++;
            packs.push_back(c);
        }
        sort(target.begin(), target.end());
        int ans = solve(target);
        return ans >= INF ? -1 : ans;
    }
};
