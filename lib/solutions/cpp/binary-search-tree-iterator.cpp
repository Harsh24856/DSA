class BSTIterator {
    stack<TreeNode*> st;
    void push(TreeNode* node) {                              // walk down the left spine
        for (; node; node = node->left) st.push(node);
    }
public:
    BSTIterator(TreeNode* root) { push(root); }

    int next() {
        TreeNode* node = st.top(); st.pop();
        push(node->right);                                   // its right subtree comes next in order
        return node->val;
    }

    bool hasNext() { return !st.empty(); }
};
// @test
    BSTIterator it(H::mkTree({7, 3, 15, NUL, NUL, 9, 20}));
    vector<int> got;
    got.push_back(it.next()); got.push_back(it.next()); got.push_back(it.hasNext());
    got.push_back(it.next()); got.push_back(it.hasNext()); got.push_back(it.next());
    got.push_back(it.hasNext()); got.push_back(it.next()); got.push_back(it.hasNext());
    H::check(got, vector<int>{3, 7, 1, 9, 1, 15, 1, 20, 0}, "BSTIterator");
