class Solution {
public:
    vector<int> topKFrequent(vector<int>& nums, int k) {
        unordered_map<int, int> cnt;
        for (int x : nums) cnt[x]++;
        vector<int> keys;
        for (auto& [v, c] : cnt) keys.push_back(v);
        // only the k most frequent need to be in order
        partial_sort(keys.begin(), keys.begin() + k, keys.end(), [&](int a, int b) { return cnt[a] > cnt[b]; });
        return vector<int>(keys.begin(), keys.begin() + k);
    }
};
// @test
    vector<int> a = {1, 1, 1, 2, 2, 3}; H::check(H::sorted(Solution().topKFrequent(a, 2)), vector<int>{1, 2}, "topK 1");
    vector<int> b = {1}; H::check(H::sorted(Solution().topKFrequent(b, 1)), vector<int>{1}, "topK 2");
    vector<int> c = {1, 2, 1, 2, 1, 2, 3, 1, 3, 2}; H::check(H::sorted(Solution().topKFrequent(c, 2)), vector<int>{1, 2}, "topK 3");
