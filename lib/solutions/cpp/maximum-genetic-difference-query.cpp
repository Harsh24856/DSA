class Solution {
    static constexpr int B = 18;
    vector<array<int, 3>> trie = {{0, 0, 0}};           // children for bit 0 and 1, then a count

    void update(int x, int d) {
        int cur = 0;
        for (int b = B - 1; b >= 0; b--) {
            int bit = (x >> b) & 1;
            if (!trie[cur][bit]) { trie.push_back({0, 0, 0}); trie[cur][bit] = trie.size() - 1; }
            cur = trie[cur][bit];
            trie[cur][2] += d;
        }
    }

    int best(int x) {                                    // largest x ^ y over the values on the path
        int cur = 0, res = 0;
        for (int b = B - 1; b >= 0; b--) {
            int want = 1 - ((x >> b) & 1);
            int nxt = trie[cur][want];
            if (nxt && trie[nxt][2]) { res |= 1 << b; cur = nxt; }
            else cur = trie[cur][1 - want];
        }
        return res;
    }

public:
    vector<int> maxGeneticDifference(vector<int>& parents, vector<vector<int>>& queries) {
        int n = parents.size(), root = -1;
        vector<vector<int>> kids(n);
        for (int v = 0; v < n; v++) {
            if (parents[v] == -1) root = v;
            else kids[parents[v]].push_back(v);
        }
        vector<vector<pair<int, int>>> at(n);           // queries asked at each node
        for (int k = 0; k < (int)queries.size(); k++) at[queries[k][0]].push_back({queries[k][1], k});
        vector<int> ans(queries.size(), 0);
        vector<pair<int, bool>> stack = {{root, false}};  // iterative DFS: the trie holds the root-to-v path
        while (!stack.empty()) {
            auto [v, leaving] = stack.back(); stack.pop_back();
            if (leaving) { update(v, -1); continue; }
            update(v, 1);
            for (auto [val, k] : at[v]) ans[k] = best(val);
            stack.push_back({v, true});
            for (int c : kids[v]) stack.push_back({c, false});
        }
        return ans;
    }
};
