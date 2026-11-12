class Solution {
    int best = 0;
    int height(TreeNode* node) {
        if (!node) return 0;
        int a = height(node->left), b = height(node->right);
        best = max(best, a + b);                           // longest path through this node
        return 1 + max(a, b);
    }
public:
    int diameterOfBinaryTree(TreeNode* root) {
        height(root);
        return best;
    }
};
