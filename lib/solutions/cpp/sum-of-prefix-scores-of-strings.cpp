class Solution {
public:
    vector<int> sumPrefixScores(vector<string>& words) {
        // trie as arrays: next[node][letter], and how many words pass through each node
        vector<array<int, 26>> next(1);
        vector<int> pass(1, 0);
        for (auto& w : words) {
            int node = 0;
            for (char ch : w) {
                int c = ch - 'a';
                if (!next[node][c]) {
                    next[node][c] = next.size();
                    next.push_back({});
                    pass.push_back(0);
                }
                node = next[node][c];
                pass[node]++;
            }
        }
        vector<int> out;
        for (auto& w : words) {
            int node = 0, s = 0;
            for (char ch : w) {
                node = next[node][ch - 'a'];
                s += pass[node];
            }
            out.push_back(s);
        }
        return out;
    }
};
