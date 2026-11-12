class Solution {
public:
    TreeNode* pruneTree(TreeNode* root) {
        if (!root) return nullptr;
        root->left = pruneTree(root->left);
        root->right = pruneTree(root->right);
        if (!root->left && !root->right && root->val == 0) return nullptr;   // a 0 leaf after pruning goes too
        return root;
    }
};
// @test
    H::check(H::levelVec(Solution().pruneTree(H::mkTree({1, NUL, 0, 0, 1}))), vector<int>{1, NUL, 0, NUL, 1}, "a");
    H::check(H::levelVec(Solution().pruneTree(H::mkTree({1, 0, 1, 0, 0, 0, 1}))), vector<int>{1, NUL, 1, NUL, 1}, "b");
    H::check(H::levelVec(Solution().pruneTree(H::mkTree({1, 1, 0, 1, 1, 0, 1, 0}))), vector<int>{1, 1, 0, 1, 1, NUL, 1}, "c");
    H::check(Solution().pruneTree(H::mkTree({0})) == nullptr, true, "d");
