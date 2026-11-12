class Solution {
    bool same(TreeNode* a, TreeNode* b) {
        if (!a || !b) return a == b;
        return a->val == b->val && same(a->left, b->left) && same(a->right, b->right);
    }
public:
    bool isSubtree(TreeNode* root, TreeNode* subRoot) {
        return root && (same(root, subRoot) || isSubtree(root->left, subRoot) || isSubtree(root->right, subRoot));
    }
};
// @test
    H::check(Solution().isSubtree(H::mkTree({3, 4, 5, 1, 2}), H::mkTree({4, 1, 2})), true, "isSubtree 1");
    H::check(Solution().isSubtree(H::mkTree({3, 4, 5, 1, 2, NUL, NUL, NUL, NUL, 0}), H::mkTree({4, 1, 2})), false, "isSubtree 2");
