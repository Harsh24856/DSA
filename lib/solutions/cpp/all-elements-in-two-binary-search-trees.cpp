class Solution {
    void inorder(TreeNode* node, vector<int>& out) {
        if (!node) return;
        inorder(node->left, out);
        out.push_back(node->val);
        inorder(node->right, out);
    }

public:
    vector<int> getAllElements(TreeNode* root1, TreeNode* root2) {
        vector<int> a, b, out;
        inorder(root1, a);   // a BST in order is sorted
        inorder(root2, b);
        size_t i = 0, j = 0;
        while (i < a.size() || j < b.size()) {   // merge two sorted lists
            if (j == b.size() || (i < a.size() && a[i] <= b[j])) out.push_back(a[i++]);
            else out.push_back(b[j++]);
        }
        return out;
    }
};
// @test
    H::check(Solution().getAllElements(H::mkTree({2, 1, 4}), H::mkTree({1, 0, 3})), vector<int>{0, 1, 1, 2, 3, 4}, "a");
    H::check(Solution().getAllElements(H::mkTree({1, NUL, 8}), H::mkTree({8, 1})), vector<int>{1, 1, 8, 8}, "b");
    H::check(Solution().getAllElements(H::mkTree({}), H::mkTree({5})), vector<int>{5}, "c");
