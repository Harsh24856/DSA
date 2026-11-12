// iterative inorder: the stack holds the ancestors whose left side is still in progress
vector<int> inorder(TreeNode* root) {
    vector<int> out;
    stack<TreeNode*> st;
    TreeNode* cur = root;
    while (cur || !st.empty()) {
        while (cur) { st.push(cur); cur = cur->left; }   // push the whole left spine
        cur = st.top(); st.pop();
        out.push_back(cur->val);
        cur = cur->right;
    }
    return out;
}
// @test
    H::check(inorder(H::mkTree({1, 2, 3, 4, 5, NUL, 6})), vector<int>{4, 2, 5, 1, 3, 6}, "inorder");
    H::check(inorder(H::mkTree({1, NUL, 2, 3})), vector<int>{1, 3, 2}, "inorder skewed");
    H::check(inorder(nullptr), vector<int>{}, "inorder empty");
