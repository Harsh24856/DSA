class Solution {
    vector<tuple<int, int, int>> cells;                      // (column, row, value)
    void dfs(TreeNode* node, int r, int c) {
        if (!node) return;
        cells.push_back({c, r, node->val});
        dfs(node->left, r + 1, c - 1);
        dfs(node->right, r + 1, c + 1);
    }
public:
    vector<vector<int>> verticalTraversal(TreeNode* root) {
        dfs(root, 0, 0);
        sort(cells.begin(), cells.end());                    // by column, then row, then value
        vector<vector<int>> out;
        int prev = INT_MIN;
        for (auto [c, r, v] : cells) {
            if (out.empty() || c != prev) { out.push_back({}); prev = c; }
            out.back().push_back(v);
        }
        return out;
    }
};
