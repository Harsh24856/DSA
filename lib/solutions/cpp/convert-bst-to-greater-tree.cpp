class Solution {
    int total = 0;
    void go(TreeNode* node) {                                // reverse inorder: largest first
        if (!node) return;
        go(node->right);
        total += node->val;
        node->val = total;
        go(node->left);
    }
public:
    TreeNode* convertBST(TreeNode* root) {
        go(root);
        return root;
    }
};
// @test
    H::check(H::levelVec(Solution().convertBST(H::mkTree({4, 1, 6, 0, 2, 5, 7, NUL, NUL, NUL, 3, NUL, NUL, NUL, 8}))),
             vector<int>{30, 36, 21, 36, 35, 26, 15, NUL, NUL, NUL, 33, NUL, NUL, NUL, 8}, "convertBST a");
    H::check(H::levelVec(Solution().convertBST(H::mkTree({0, NUL, 1}))), vector<int>{1, NUL, 1}, "convertBST b");
