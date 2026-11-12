class Solution {
public:
    TreeNode* trimBST(TreeNode* root, int low, int high) {
        if (!root) return nullptr;
        if (root->val < low) return trimBST(root->right, low, high);    // root and its left are too small
        if (root->val > high) return trimBST(root->left, low, high);    // root and its right are too big
        root->left = trimBST(root->left, low, high);
        root->right = trimBST(root->right, low, high);
        return root;
    }
};
// @test
    H::check(H::levelVec(Solution().trimBST(H::mkTree({1, 0, 2}), 1, 2)), vector<int>{1, NUL, 2}, "trimBST a");
    H::check(H::levelVec(Solution().trimBST(H::mkTree({3, 0, 4, NUL, 2, NUL, NUL, 1}), 1, 3)), vector<int>{3, 2, NUL, 1}, "trimBST b");
