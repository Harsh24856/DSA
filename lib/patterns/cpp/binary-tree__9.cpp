// Morris inorder: thread each node's predecessor back to it instead of using a stack
vector<int> morrisInorder(TreeNode* root) {
    vector<int> out;
    TreeNode* cur = root;
    while (cur) {
        if (!cur->left) { out.push_back(cur->val); cur = cur->right; continue; }
        TreeNode* pre = cur->left;
        while (pre->right && pre->right != cur) pre = pre->right;   // stop at the thread too
        if (!pre->right) {
            pre->right = cur;           // thread back to cur, then do the left side
            cur = cur->left;
        } else {
            pre->right = nullptr;       // second arrival: left side done, unthread
            out.push_back(cur->val);
            cur = cur->right;
        }
    }
    return out;
}
// @test
    TreeNode* t = H::mkTree({4, 2, 6, 1, 3, 5, 7});
    H::check(morrisInorder(t), vector<int>{1, 2, 3, 4, 5, 6, 7}, "morris inorder");
    H::check(H::levelVec(t), vector<int>{4, 2, 6, 1, 3, 5, 7}, "tree restored");
    H::check(morrisInorder(H::mkTree({1, NUL, 2, 3})), vector<int>{1, 3, 2}, "morris skewed");
    H::check(morrisInorder(nullptr), vector<int>{}, "morris empty");
