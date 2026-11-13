class Solution {
    int dfs(TreeNode* node, int best) {
        if (!node) return 0;
        int good = node->val >= best ? 1 : 0;           // nothing above it is larger
        best = max(best, node->val);
        return good + dfs(node->left, best) + dfs(node->right, best);
    }
public:
    int goodNodes(TreeNode* root) {
        return dfs(root, root->val);
    }
};
