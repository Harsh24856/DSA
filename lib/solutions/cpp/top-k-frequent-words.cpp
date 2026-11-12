class Solution {
public:
    vector<string> topKFrequent(vector<string>& words, int k) {
        unordered_map<string, int> cnt;
        for (auto& w : words) cnt[w]++;
        vector<string> keys;
        for (auto& [w, c] : cnt) keys.push_back(w);
        // most frequent first, ties in alphabetical order
        partial_sort(keys.begin(), keys.begin() + k, keys.end(), [&](auto& a, auto& b) {
            return cnt[a] != cnt[b] ? cnt[a] > cnt[b] : a < b;
        });
        keys.resize(k);
        return keys;
    }
};
