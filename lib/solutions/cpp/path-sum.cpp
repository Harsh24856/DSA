class Solution {
public:
    bool hasPathSum(TreeNode* root, int targetSum) {
        if (!root) return false;
        if (!root->left && !root->right) return root->val == targetSum;   // a leaf must finish the sum
        int rem = targetSum - root->val;
        return hasPathSum(root->left, rem) || hasPathSum(root->right, rem);
    }
};
