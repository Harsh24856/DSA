// returns p or q if only that one is below, the LCA if both are, nullptr if neither
TreeNode* lca(TreeNode* root, TreeNode* p, TreeNode* q) {
    if (!root || root == p || root == q) return root;
    TreeNode* l = lca(root->left, p, q);
    TreeNode* r = lca(root->right, p, q);
    if (l && r) return root;          // p and q split here
    return l ? l : r;
}
// @test
    TreeNode* t = H::mkTree({3, 5, 1, 6, 2, 0, 8, NUL, NUL, 7, 4});
    H::check(lca(t, H::find(t, 5), H::find(t, 1))->val, 3, "lca split at root");
    H::check(lca(t, H::find(t, 5), H::find(t, 4))->val, 5, "lca is one of them");
    H::check(lca(t, H::find(t, 7), H::find(t, 4))->val, 2, "lca deep");
