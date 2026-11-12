class Solution {
public:
    vector<int> rearrangeBarcodes(vector<int>& barcodes) {
        unordered_map<int, int> cnt;
        for (int b : barcodes) cnt[b]++;
        vector<pair<int, int>> byCount;   // (count, value)
        for (auto& [v, c] : cnt) byCount.push_back({c, v});
        sort(byCount.rbegin(), byCount.rend());   // most common first
        vector<int> order;
        for (auto [c, v] : byCount) order.insert(order.end(), c, v);
        int n = barcodes.size(), half = (n + 1) / 2;
        vector<int> out(n);
        for (int i = 0; i < n; i++)               // first half on even slots, the rest on odd slots
            out[i < half ? 2 * i : 2 * (i - half) + 1] = order[i];
        return out;
    }
};
// @test
    for (vector<int> a : vector<vector<int>>{{1, 1, 1, 2, 2, 2}, {1, 1, 1, 1, 2, 2, 3, 3}, {7}}) {
        vector<int> in = a;
        auto out = Solution().rearrangeBarcodes(in);
        bool apart = true;
        for (size_t i = 1; i < out.size(); i++) apart &= out[i] != out[i - 1];
        H::check(H::sorted(out), H::sorted(a), "rearrangeBarcodes same values");
        H::check(apart, true, "rearrangeBarcodes no neighbours equal");
    }
