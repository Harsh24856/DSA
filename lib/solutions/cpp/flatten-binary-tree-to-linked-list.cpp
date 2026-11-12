class Solution {
public:
    void flatten(TreeNode* root) {
        for (TreeNode* node = root; node; node = node->right) {
            if (node->left) {
                TreeNode* pre = node->left;
                while (pre->right) pre = pre->right;   // last node of the left subtree
                pre->right = node->right;
                node->right = node->left;
                node->left = nullptr;
            }
        }
    }
};
// @test
    TreeNode* a = H::mkTree({1, 2, 5, 3, 4, NUL, 6});
    Solution().flatten(a);
    H::check(H::levelVec(a), vector<int>{1, NUL, 2, NUL, 3, NUL, 4, NUL, 5, NUL, 6}, "a");
    TreeNode* b = H::mkTree({0});
    Solution().flatten(b);
    H::check(H::levelVec(b), vector<int>{0}, "b");
