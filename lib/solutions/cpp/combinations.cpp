class Solution {
    vector<vector<int>> out;
    vector<int> path;

    void dfs(int n, int k, int start) {
        if ((int)path.size() == k) { out.push_back(path); return; }
        for (int x = start; x <= n - (k - (int)path.size()) + 1; x++) {   // leave room for the rest
            path.push_back(x);
            dfs(n, k, x + 1);
            path.pop_back();
        }
    }

public:
    vector<vector<int>> combine(int n, int k) {
        dfs(n, k, 1);
        return out;
    }
};
