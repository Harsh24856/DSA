class Solution {
public:
    vector<vector<string>> partition(string s) {
        vector<vector<string>> out;
        vector<string> path;
        function<void(int)> dfs = [&](int i) {
            if (i == (int)s.size()) { out.push_back(path); return; }
            for (int j = i + 1; j <= (int)s.size(); j++) {
                string piece = s.substr(i, j - i);
                if (piece == string(piece.rbegin(), piece.rend())) {   // only cut off palindromes
                    path.push_back(piece);
                    dfs(j);
                    path.pop_back();
                }
            }
        };
        dfs(0);
        return out;
    }
};
