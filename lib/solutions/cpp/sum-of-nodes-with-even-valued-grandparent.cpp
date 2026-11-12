class Solution {
    int dfs(TreeNode* node, int parent, int grand) {
        if (!node) return 0;
        int here = grand % 2 == 0 ? node->val : 0;
        return here + dfs(node->left, node->val, parent) + dfs(node->right, node->val, parent);
    }

public:
    int sumEvenGrandparent(TreeNode* root) {
        return dfs(root, 1, 1);   // odd placeholders for the missing ancestors
    }
};
