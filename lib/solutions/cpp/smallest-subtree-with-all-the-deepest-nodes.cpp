class Solution {
    // returns {depth, answer}
    pair<int, TreeNode*> go(TreeNode* node) {
        if (!node) return {0, nullptr};
        auto [ld, ln] = go(node->left);
        auto [rd, rn] = go(node->right);
        if (ld > rd) return {ld + 1, ln};
        if (rd > ld) return {rd + 1, rn};
        return {ld + 1, node};   // deepest nodes on both sides: this node holds them all
    }

public:
    TreeNode* subtreeWithAllDeepest(TreeNode* root) {
        return go(root).second;
    }
};
// @test
    H::check(H::levelVec(Solution().subtreeWithAllDeepest(H::mkTree({3, 5, 1, 6, 2, 0, 8, NUL, NUL, 7, 4}))), vector<int>{2, 7, 4}, "a");
    H::check(H::levelVec(Solution().subtreeWithAllDeepest(H::mkTree({1}))), vector<int>{1}, "b");
    H::check(H::levelVec(Solution().subtreeWithAllDeepest(H::mkTree({0, 1, 3, NUL, 2}))), vector<int>{2}, "c");
