class Solution {
public:
    vector<vector<int>> pathSum(TreeNode* root, int targetSum) {
        vector<vector<int>> out;
        vector<int> path;
        function<void(TreeNode*, int)> dfs = [&](TreeNode* node, int rem) {
            if (!node) return;
            path.push_back(node->val);
            rem -= node->val;
            if (!node->left && !node->right && rem == 0) out.push_back(path);
            dfs(node->left, rem);
            dfs(node->right, rem);
            path.pop_back();                           // backtrack
        };
        dfs(root, targetSum);
        return out;
    }
};
