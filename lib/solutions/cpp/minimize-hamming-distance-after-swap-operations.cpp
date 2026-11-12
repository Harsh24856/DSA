class Solution {
public:
    int minimumHammingDistance(vector<int>& source, vector<int>& target, vector<vector<int>>& allowedSwaps) {
        vector<int> parent(source.size());
        iota(parent.begin(), parent.end(), 0);
        auto find = [&](int x) {
            while (parent[x] != x) { parent[x] = parent[parent[x]]; x = parent[x]; }   // path halving
            return x;
        };
        for (auto& s : allowedSwaps) parent[find(s[0])] = find(s[1]);   // positions that can swap form groups
        unordered_map<int, unordered_map<int, int>> have;  // group -> value counts from source
        for (int i = 0; i < (int)source.size(); i++) have[find(i)][source[i]]++;
        int ans = 0;
        for (int i = 0; i < (int)target.size(); i++) {
            int& c = have[find(i)][target[i]];
            if (c > 0) c--;
            else ans++;                                // no matching value left in this group
        }
        return ans;
    }
};
