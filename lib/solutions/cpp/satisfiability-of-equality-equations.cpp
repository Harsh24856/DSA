class Solution {
public:
    bool equationsPossible(vector<string>& equations) {
        int parent[26];
        iota(parent, parent + 26, 0);
        auto find = [&](int x) {
            while (parent[x] != x) {
                parent[x] = parent[parent[x]];   // path halving
                x = parent[x];
            }
            return x;
        };
        for (auto& e : equations)
            if (e[1] == '=') parent[find(e[0] - 'a')] = find(e[3] - 'a');
        for (auto& e : equations)
            if (e[1] == '!' && find(e[0] - 'a') == find(e[3] - 'a')) return false;
        return true;
    }
};
