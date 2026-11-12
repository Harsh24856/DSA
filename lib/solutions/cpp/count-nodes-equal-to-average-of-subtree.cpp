class Solution {
    int ans = 0;
    pair<int, int> go(TreeNode* node) {   // (sum, count) of the subtree
        if (!node) return {0, 0};
        auto [ls, lc] = go(node->left);
        auto [rs, rc] = go(node->right);
        int s = ls + rs + node->val, c = lc + rc + 1;
        if (s / c == node->val) ans++;
        return {s, c};
    }
public:
    int averageOfSubtree(TreeNode* root) {
        go(root);
        return ans;
    }
};
