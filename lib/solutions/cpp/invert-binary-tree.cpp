class Solution {
public:
    TreeNode* invertTree(TreeNode* root) {
        if (root) {
            TreeNode* left = invertTree(root->right);      // swap the inverted subtrees
            root->right = invertTree(root->left);
            root->left = left;
        }
        return root;
    }
};
// @test
    H::check(H::levelVec(Solution().invertTree(H::mkTree({4, 2, 7, 1, 3, 6, 9}))), vector<int>{4, 7, 2, 9, 6, 3, 1}, "invert a");
    H::check(H::levelVec(Solution().invertTree(H::mkTree({2, 1, 3}))), vector<int>{2, 3, 1}, "invert b");
    H::check(H::levelVec(Solution().invertTree(H::mkTree({}))), vector<int>{}, "invert empty");
