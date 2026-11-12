// the next preorder value is the root; its inorder position splits left from right
TreeNode* build(const vector<int>& preorder, const vector<int>& inorder) {
    unordered_map<int, int> idx;
    for (int i = 0; i < (int)inorder.size(); i++) idx[inorder[i]] = i;
    int next = 0;
    function<TreeNode*(int, int)> go = [&](int lo, int hi) -> TreeNode* {
        if (lo > hi) return nullptr;
        int v = preorder[next++];
        TreeNode* node = new TreeNode(v);
        node->left = go(lo, idx[v] - 1);      // left first: preorder lists it first
        node->right = go(idx[v] + 1, hi);
        return node;
    };
    return go(0, (int)inorder.size() - 1);
}
// @test
    H::check(H::levelVec(build({3, 9, 20, 15, 7}, {9, 3, 15, 20, 7})), vector<int>{3, 9, 20, NUL, NUL, 15, 7}, "build");
    H::check(H::levelVec(build({-1}, {-1})), vector<int>{-1}, "build single");
    H::check(H::levelVec(build({1, 2, 3}, {3, 2, 1})), vector<int>{1, 2, NUL, 3}, "build left chain");
