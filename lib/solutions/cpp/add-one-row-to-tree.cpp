class Solution {
public:
    TreeNode* addOneRow(TreeNode* root, int val, int depth) {
        if (depth == 1) return new TreeNode(val, root, nullptr);   // old tree goes on the left
        vector<TreeNode*> level{root};
        for (int d = 0; d < depth - 2; d++) {                       // walk down to the row above the new one
            vector<TreeNode*> next;
            for (TreeNode* n : level)
                for (TreeNode* c : {n->left, n->right})
                    if (c) next.push_back(c);
            level = next;
        }
        for (TreeNode* n : level) {
            n->left = new TreeNode(val, n->left, nullptr);
            n->right = new TreeNode(val, nullptr, n->right);
        }
        return root;
    }
};
// @test
    H::check(H::levelVec(Solution().addOneRow(H::mkTree({4, 2, 6, 3, 1, 5}), 1, 2)), vector<int>{4, 1, 1, 2, NUL, NUL, 6, 3, 1, 5}, "a");
    H::check(H::levelVec(Solution().addOneRow(H::mkTree({4, 2, NUL, 3, 1}), 1, 3)), vector<int>{4, 2, NUL, 1, 1, 3, NUL, NUL, 1}, "b");
    H::check(H::levelVec(Solution().addOneRow(H::mkTree({1}), 5, 1)), vector<int>{5, 1}, "root");
