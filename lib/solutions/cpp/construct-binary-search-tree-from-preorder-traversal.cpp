class Solution {
public:
    TreeNode* bstFromPreorder(vector<int>& preorder) {
        size_t i = 0;
        function<TreeNode*(int)> build = [&](int hi) -> TreeNode* {
            if (i == preorder.size() || preorder[i] > hi) return nullptr;   // next value belongs higher up
            TreeNode* node = new TreeNode(preorder[i++]);
            node->left = build(node->val);
            node->right = build(hi);
            return node;
        };
        return build(INT_MAX);
    }
};
// @test
    vector<int> pre{8, 5, 1, 7, 10, 12};
    H::check(H::levelVec(Solution().bstFromPreorder(pre)), vector<int>{8, 5, 10, 1, 7, NUL, 12}, "bstFromPreorder");
