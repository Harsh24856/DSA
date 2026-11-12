// count, then keep the k most frequent values in a min-heap ordered by count
vector<int> topKFrequent(const vector<int>& nums, int k) {
    unordered_map<int, int> cnt;
    for (int x : nums) cnt[x]++;
    priority_queue<pair<int, int>, vector<pair<int, int>>, greater<>> h;   // (count, value), least frequent on top
    for (auto [v, c] : cnt) {
        h.push({c, v});
        if ((int)h.size() > k) h.pop();
    }
    vector<int> out;
    for (; !h.empty(); h.pop()) out.push_back(h.top().second);
    return out;
}
// @test
    H::check(H::sorted(topKFrequent({1, 1, 1, 2, 2, 3}, 2)), vector<int>{1, 2}, "classic");
    H::check(topKFrequent({1}, 1), vector<int>{1}, "one");
    H::check(H::sorted(topKFrequent({4, 4, 1, 2, 2, 3, 3, 3, 3}, 3)), vector<int>{2, 3, 4}, "three");
