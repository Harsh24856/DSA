class Solution {
    int dfs(TreeNode* node, int mask) {
        if (!node) return 0;
        mask ^= 1 << node->val;                                  // parity of each digit
        if (!node->left && !node->right) return (mask & (mask - 1)) == 0;   // at most one odd
        return dfs(node->left, mask) + dfs(node->right, mask);
    }
public:
    int pseudoPalindromicPaths(TreeNode* root) { return dfs(root, 0); }
};
