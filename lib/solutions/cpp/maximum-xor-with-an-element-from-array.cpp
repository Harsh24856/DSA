class Solution {
public:
    vector<int> maximizeXor(vector<int>& nums, vector<vector<int>>& queries) {
        sort(nums.begin(), nums.end());
        vector<int> order(queries.size());
        iota(order.begin(), order.end(), 0);
        stable_sort(order.begin(), order.end(), [&](int a, int b) { return queries[a][1] < queries[b][1]; });   // by limit m
        vector<array<int, 2>> trie = {{0, 0}};          // binary trie; 0 means no child
        vector<int> ans(queries.size(), -1);
        size_t i = 0;
        for (int k : order) {
            int x = queries[k][0], m = queries[k][1];
            for (; i < nums.size() && nums[i] <= m; i++) {   // add every number allowed for this query
                int node = 0;
                for (int b = 29; b >= 0; b--) {
                    int bit = (nums[i] >> b) & 1;
                    if (!trie[node][bit]) { trie.push_back({0, 0}); trie[node][bit] = trie.size() - 1; }
                    node = trie[node][bit];
                }
            }
            if (i == 0) continue;                        // nothing is small enough
            int node = 0, best = 0;
            for (int b = 29; b >= 0; b--) {
                int bit = (x >> b) & 1;
                if (trie[node][1 - bit]) { best |= 1 << b; node = trie[node][1 - bit]; }   // take the opposite bit
                else node = trie[node][bit];
            }
            ans[k] = best;
        }
        return ans;
    }
};
