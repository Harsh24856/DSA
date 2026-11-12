class Solution {
public:
    TreeNode* bstToGst(TreeNode* root) {
        int total = 0;
        function<void(TreeNode*)> go = [&](TreeNode* n) {
            if (!n) return;
            go(n->right);                                  // reverse inorder: largest values first
            total += n->val;
            n->val = total;
            go(n->left);
        };
        go(root);
        return root;
    }
};
// @test
    H::check(H::levelVec(Solution().bstToGst(H::mkTree({4, 1, 6, 0, 2, 5, 7, NUL, NUL, NUL, 3, NUL, NUL, NUL, 8}))), vector<int>{30, 36, 21, 36, 35, 26, 15, NUL, NUL, NUL, 33, NUL, NUL, NUL, 8}, "a");
    H::check(H::levelVec(Solution().bstToGst(H::mkTree({0, NUL, 1}))), vector<int>{1, NUL, 1}, "b");
