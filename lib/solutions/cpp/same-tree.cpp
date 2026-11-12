class Solution {
public:
    bool isSameTree(TreeNode* p, TreeNode* q) {
        if (!p || !q) return p == q;                       // both empty, or only one is
        return p->val == q->val && isSameTree(p->left, q->left) && isSameTree(p->right, q->right);
    }
};
// @test
    H::check(Solution().isSameTree(H::mkTree({1, 2, 3}), H::mkTree({1, 2, 3})), true, "same a");
    H::check(Solution().isSameTree(H::mkTree({1, 2}), H::mkTree({1, NUL, 2})), false, "same b");
    H::check(Solution().isSameTree(H::mkTree({1, 2, 1}), H::mkTree({1, 1, 2})), false, "same c");
