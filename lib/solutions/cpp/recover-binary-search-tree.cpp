class Solution {
public:
    void recoverTree(TreeNode* root) {
        TreeNode *first = nullptr, *second = nullptr, *prev = nullptr;
        vector<TreeNode*> st;
        TreeNode* node = root;
        while (!st.empty() || node) {                  // iterative inorder
            while (node) { st.push_back(node); node = node->left; }
            node = st.back(); st.pop_back();
            if (prev && prev->val > node->val) {       // a drop in the sorted order
                if (!first) first = prev;
                second = node;
            }
            prev = node;
            node = node->right;
        }
        swap(first->val, second->val);
    }
};
// @test
    for (auto [a, exp] : vector<pair<vector<int>, vector<int>>>{{{1, 3, NUL, NUL, 2}, {3, 1, NUL, NUL, 2}}, {{3, 1, 4, NUL, NUL, 2}, {2, 1, 4, NUL, NUL, 3}}}) {
        TreeNode* r = H::mkTree(a);
        Solution().recoverTree(r);
        H::check(H::levelVec(r), exp, "recoverTree");
    }
