class Solution {
public:
    string smallestStringWithSwaps(string s, vector<vector<int>>& pairs) {
        int n = s.size();
        vector<int> parent(n);
        iota(parent.begin(), parent.end(), 0);
        auto find = [&](int x) {
            while (parent[x] != x) {
                parent[x] = parent[parent[x]];
                x = parent[x];
            }
            return x;
        };
        for (auto& p : pairs) parent[find(p[0])] = find(p[1]);
        unordered_map<int, vector<int>> groups;   // root -> indices, in increasing order
        for (int i = 0; i < n; i++) groups[find(i)].push_back(i);
        string out = s;
        for (auto& [r, idx] : groups) {
            string chars;
            for (int i : idx) chars += s[i];
            sort(chars.begin(), chars.end());
            for (int k = 0; k < (int)idx.size(); k++) out[idx[k]] = chars[k];   // smallest letters to the earliest slots
        }
        return out;
    }
};
