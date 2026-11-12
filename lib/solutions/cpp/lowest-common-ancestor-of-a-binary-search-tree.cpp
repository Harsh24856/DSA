class Solution {
public:
    TreeNode* lowestCommonAncestor(TreeNode* root, TreeNode* p, TreeNode* q) {
        TreeNode* node = root;
        while (node) {
            if (p->val < node->val && q->val < node->val) node = node->left;         // both on the left
            else if (p->val > node->val && q->val > node->val) node = node->right;   // both on the right
            else return node;                                // they split here
        }
        return nullptr;
    }
};
// @test
    for (auto [p, q, e] : vector<array<int, 3>>{{2, 8, 6}, {2, 4, 2}, {3, 5, 4}}) {
        TreeNode* r = H::mkTree({6, 2, 8, 0, 4, 7, 9, NUL, NUL, 3, 5});
        H::check(Solution().lowestCommonAncestor(r, H::find(r, p), H::find(r, q))->val, e, "lcaBST " + to_string(p) + " " + to_string(q));
    }
    TreeNode* r = H::mkTree({2, 1});
    H::check(Solution().lowestCommonAncestor(r, H::find(r, 2), H::find(r, 1))->val, 2, "lcaBST b");
