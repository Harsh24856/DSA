class Solution {
    int height(TreeNode* node) {                           // -1 means unbalanced below
        if (!node) return 0;
        int a = height(node->left), b = height(node->right);
        if (a < 0 || b < 0 || abs(a - b) > 1) return -1;
        return 1 + max(a, b);
    }
public:
    bool isBalanced(TreeNode* root) { return height(root) >= 0; }
};
