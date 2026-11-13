class Solution {
    int dfs(TreeNode* node, int num) {
        if (!node) return 0;
        num = num * 10 + node->val;                     // append this digit
        if (!node->left && !node->right) return num;    // leaf: the number is complete
        return dfs(node->left, num) + dfs(node->right, num);
    }
public:
    int sumNumbers(TreeNode* root) {
        return dfs(root, 0);
    }
};
