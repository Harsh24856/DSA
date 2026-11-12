class Solution {
public:
    TreeNode* removeLeafNodes(TreeNode* root, int target) {
        if (!root) return nullptr;
        root->left = removeLeafNodes(root->left, target);      // children first, so new leaves get checked
        root->right = removeLeafNodes(root->right, target);
        if (!root->left && !root->right && root->val == target) return nullptr;
        return root;
    }
};
// @test
    H::check(H::levelVec(Solution().removeLeafNodes(H::mkTree({1, 2, 3, 2, NUL, 2, 4}), 2)), vector<int>{1, NUL, 3, NUL, 4}, "a");
    H::check(H::levelVec(Solution().removeLeafNodes(H::mkTree({1, 1, 1}), 1)), vector<int>{}, "all");
