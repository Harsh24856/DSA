// each node returns {best if taken, best if skipped}
pair<int, int> robGo(TreeNode* node) {
    if (!node) return {0, 0};
    auto [lt, ls] = robGo(node->left);
    auto [rt, rs] = robGo(node->right);
    int take = node->val + ls + rs;                      // children must be skipped
    int skip = max(lt, ls) + max(rt, rs);                // children are free
    return {take, skip};
}
int rob(TreeNode* root) { auto [t, s] = robGo(root); return max(t, s); }
// @test
    H::check(rob(H::mkTree({3, 2, 3, NUL, 3, NUL, 1})), 7, "house robber iii");
    H::check(rob(H::mkTree({3, 4, 5, 1, 3, NUL, 1})), 9, "house robber iii 2");
    H::check(rob(nullptr), 0, "empty tree");
    H::check(rob(H::mkTree({4, 1, NUL, 2, NUL, 3})), 7, "skip two levels");
