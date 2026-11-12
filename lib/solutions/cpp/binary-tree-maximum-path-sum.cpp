class Solution {
    int best = INT_MIN;
    int gain(TreeNode* node) {                             // best downward path starting here
        if (!node) return 0;
        int a = max(gain(node->left), 0), b = max(gain(node->right), 0);
        best = max(best, node->val + a + b);               // path that bends at this node
        return node->val + max(a, b);
    }
public:
    int maxPathSum(TreeNode* root) {
        gain(root);
        return best;
    }
};
