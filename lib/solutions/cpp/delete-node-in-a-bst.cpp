class Solution {
public:
    TreeNode* deleteNode(TreeNode* root, int key) {
        if (!root) return nullptr;
        if (key < root->val) root->left = deleteNode(root->left, key);
        else if (key > root->val) root->right = deleteNode(root->right, key);
        else {
            if (!root->left) return root->right;             // zero or one child: lift the other side
            if (!root->right) return root->left;
            TreeNode* s = root->right;                       // two children: take the inorder successor
            while (s->left) s = s->left;
            root->val = s->val;
            root->right = deleteNode(root->right, s->val);
        }
        return root;
    }
};
// @test
    H::check(H::levelVec(Solution().deleteNode(H::mkTree({5, 3, 6, 2, 4, NUL, 7}), 3)), vector<int>{5, 4, 6, 2, NUL, NUL, 7}, "deleteNode a");
    H::check(H::levelVec(Solution().deleteNode(H::mkTree({5, 3, 6, 2, 4, NUL, 7}), 0)), vector<int>{5, 3, 6, 2, 4, NUL, 7}, "deleteNode b");
    H::check(Solution().deleteNode(nullptr, 0) == nullptr, true, "deleteNode c");
