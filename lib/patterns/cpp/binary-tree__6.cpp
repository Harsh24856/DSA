// every node must lie inside the open window set by all its ancestors; long long bounds avoid INT_MIN/INT_MAX clashes
bool isBst(TreeNode* node, long long lo = LLONG_MIN, long long hi = LLONG_MAX) {
    if (!node) return true;
    if (!(lo < node->val && node->val < hi)) return false;
    return isBst(node->left, lo, node->val) && isBst(node->right, node->val, hi);
}
// @test
    H::check(isBst(H::mkTree({2, 1, 3})), true, "valid bst");
    H::check(isBst(H::mkTree({5, 1, 4, NUL, NUL, 3, 6})), false, "right child too small");
    H::check(isBst(H::mkTree({5, 4, 6, NUL, NUL, 3, 7})), false, "grandchild breaks the root bound");
    H::check(isBst(H::mkTree({2147483647})), true, "int max value");
    H::check(isBst(H::mkTree({1, 1})), false, "duplicates rejected");
