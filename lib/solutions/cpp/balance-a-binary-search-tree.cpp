class Solution {
public:
    TreeNode* balanceBST(TreeNode* root) {
        vector<int> vals;
        function<void(TreeNode*)> inorder = [&](TreeNode* n) {
            if (n) { inorder(n->left); vals.push_back(n->val); inorder(n->right); }
        };
        inorder(root);                                     // sorted values
        function<TreeNode*(int, int)> build = [&](int lo, int hi) -> TreeNode* {
            if (lo > hi) return nullptr;
            int mid = (lo + hi) / 2;                       // middle value becomes the root
            return new TreeNode(vals[mid], build(lo, mid - 1), build(mid + 1, hi));
        };
        return build(0, (int)vals.size() - 1);
    }
};
// @test
    TreeNode* r = Solution().balanceBST(H::mkTree({1, NUL, 2, NUL, 3, NUL, 4}));
    H::check(H::inorderVec(r), vector<int>{1, 2, 3, 4}, "inorder");
    H::check(H::balanced(r), true, "balanced");
