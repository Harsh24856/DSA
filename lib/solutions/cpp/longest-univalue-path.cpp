class Solution {
public:
    int longestUnivaluePath(TreeNode* root) {
        int best = 0;
        // longest same-value arm going down from node
        function<int(TreeNode*)> arm = [&](TreeNode* node) {
            if (!node) return 0;
            int l = arm(node->left), r = arm(node->right);
            l = node->left && node->left->val == node->val ? l + 1 : 0;
            r = node->right && node->right->val == node->val ? r + 1 : 0;
            best = max(best, l + r);                   // a path may bend here
            return max(l, r);
        };
        arm(root);
        return best;
    }
};
