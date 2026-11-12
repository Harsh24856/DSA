class Solution {
public:
    int maxAncestorDiff(TreeNode* root) {
        // carry the smallest and largest value on the path down
        function<int(TreeNode*, int, int)> go = [&](TreeNode* node, int lo, int hi) {
            if (!node) return hi - lo;
            lo = min(lo, node->val);
            hi = max(hi, node->val);
            return max(go(node->left, lo, hi), go(node->right, lo, hi));
        };
        return go(root, root->val, root->val);
    }
};
