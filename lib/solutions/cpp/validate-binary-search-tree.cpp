class Solution {
    bool ok(TreeNode* node, long long lo, long long hi) {    // long long bounds fit every int value
        if (!node) return true;
        if (!(lo < node->val && node->val < hi)) return false;
        return ok(node->left, lo, node->val) && ok(node->right, node->val, hi);
    }
public:
    bool isValidBST(TreeNode* root) {
        return ok(root, LLONG_MIN, LLONG_MAX);
    }
};
