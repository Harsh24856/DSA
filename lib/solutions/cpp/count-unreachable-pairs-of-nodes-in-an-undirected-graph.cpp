class Solution {
    vector<int> parent;
    int find(int x) {
        while (parent[x] != x) {
            parent[x] = parent[parent[x]];
            x = parent[x];
        }
        return x;
    }
public:
    long long countPairs(int n, vector<vector<int>>& edges) {
        parent.resize(n);
        iota(parent.begin(), parent.end(), 0);
        for (auto& e : edges) parent[find(e[0])] = find(e[1]);
        unordered_map<int, long long> size;
        for (int x = 0; x < n; x++) size[find(x)]++;
        long long ans = 0, seen = 0;
        for (auto& [root, s] : size) {   // pairs with a node in an earlier component
            ans += s * seen;
            seen += s;
        }
        return ans;
    }
};
