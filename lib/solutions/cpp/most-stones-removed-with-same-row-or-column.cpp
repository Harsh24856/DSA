class Solution {
public:
    int removeStones(vector<vector<int>>& stones) {
        unordered_map<int, int> parent;                // rows as r, columns as ~c so they never clash
        function<int(int)> find = [&](int x) {
            parent.emplace(x, x);
            while (parent[x] != x) { parent[x] = parent[parent[x]]; x = parent[x]; }
            return x;
        };
        for (auto& s : stones) {
            int a = find(s[0]), b = find(~s[1]);
            parent[a] = b;                             // a stone joins its row and its column
        }
        vector<int> keys;
        for (auto& [x, _] : parent) keys.push_back(x);
        unordered_set<int> groups;
        for (int x : keys) groups.insert(find(x));
        return stones.size() - groups.size();          // each group keeps one stone
    }
};
