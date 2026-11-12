// BFS one level at a time; pushing the right child first makes the first node of each level the visible one
vector<int> rightView(TreeNode* root) {
    vector<int> out;
    if (!root) return out;
    queue<TreeNode*> q;
    q.push(root);
    while (!q.empty()) {
        int size = q.size();                      // exactly one level is in the queue
        for (int i = 0; i < size; i++) {
            TreeNode* n = q.front(); q.pop();
            if (i == 0) out.push_back(n->val);
            if (n->right) q.push(n->right);
            if (n->left) q.push(n->left);
        }
    }
    return out;
}
// @test
    H::check(rightView(H::mkTree({1, 2, 3, NUL, 5, NUL, 4})), vector<int>{1, 3, 4}, "right view");
    H::check(rightView(H::mkTree({1, 2, 3, 4})), vector<int>{1, 3, 4}, "right view left deeper");
    H::check(rightView(nullptr), vector<int>{}, "right view empty");
