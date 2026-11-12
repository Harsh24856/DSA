class Solution {
public:
    TreeNode* lowestCommonAncestor(TreeNode* root, TreeNode* p, TreeNode* q) {
        if (!root || root == p || root == q) return root;
        TreeNode* L = lowestCommonAncestor(root->left, p, q);
        TreeNode* R = lowestCommonAncestor(root->right, p, q);
        if (L && R) return root;   // p and q are on different sides
        return L ? L : R;
    }
};
// @test
    TreeNode* r = H::mkTree({3, 5, 1, 6, 2, 0, 8, NUL, NUL, 7, 4});
    for (auto [p, q, e] : vector<tuple<int, int, int>>{{5, 1, 3}, {5, 4, 5}, {7, 8, 3}})
        H::check(Solution().lowestCommonAncestor(r, H::find(r, p), H::find(r, q))->val, e, "LCA " + to_string(p) + " " + to_string(q));
    TreeNode* s = H::mkTree({1, 2});
    H::check(Solution().lowestCommonAncestor(s, H::find(s, 1), H::find(s, 2))->val, 1, "LCA small");
