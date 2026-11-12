class Solution {
public:
    TreeNode* insertIntoBST(TreeNode* root, int val) {
        if (!root) return new TreeNode(val);                 // the empty spot it belongs in
        if (val < root->val) root->left = insertIntoBST(root->left, val);
        else root->right = insertIntoBST(root->right, val);
        return root;
    }
};
// @test
    H::check(H::levelVec(Solution().insertIntoBST(H::mkTree({4, 2, 7, 1, 3}), 5)), vector<int>{4, 2, 7, 1, 3, 5}, "insert a");
    H::check(H::levelVec(Solution().insertIntoBST(H::mkTree({40, 20, 60, 10, 30, 50, 70}), 25)), vector<int>{40, 20, 60, 10, 30, 50, 70, NUL, NUL, 25}, "insert b");
    H::check(H::levelVec(Solution().insertIntoBST(nullptr, 5)), vector<int>{5}, "insert empty");
