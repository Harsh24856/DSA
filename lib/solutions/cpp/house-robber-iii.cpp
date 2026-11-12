class Solution {
    pair<int, int> go(TreeNode* node) {                  // (best if we rob node, best if we skip it)
        if (!node) return {0, 0};
        auto l = go(node->left), r = go(node->right);
        int take = node->val + l.second + r.second;
        int skip = max(l.first, l.second) + max(r.first, r.second);
        return {take, skip};
    }

public:
    int rob(TreeNode* root) {
        auto [take, skip] = go(root);
        return max(take, skip);
    }
};
