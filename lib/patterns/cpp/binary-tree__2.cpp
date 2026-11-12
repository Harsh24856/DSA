// post-order: return the height to the parent, record the bent path at each node
int diameter(TreeNode* root) {
    int best = 0;
    function<int(TreeNode*)> h = [&](TreeNode* node) {
        if (!node) return 0;
        int l = h(node->left), r = h(node->right);
        best = max(best, l + r);      // path bending here
        return 1 + max(l, r);         // height for the parent
    };
    h(root);
    return best;
}
// @test
    H::check(diameter(H::mkTree({1, 2, 3, 4, 5})), 3, "diameter");
    H::check(diameter(H::mkTree({1, 2})), 1, "diameter two nodes");
    H::check(diameter(H::mkTree({1})), 0, "diameter one node");
    H::check(diameter(H::mkTree({1, 2, NUL, 3, 4, 5, NUL, NUL, 6})), 4, "diameter not through root");
