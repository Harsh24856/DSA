class Solution {
public:
    TreeNode* constructFromPrePost(vector<int>& preorder, vector<int>& postorder) {
        unordered_map<int, int> at;
        for (int i = 0; i < (int)postorder.size(); i++) at[postorder[i]] = i;
        // preorder[a..b], postorder starting at c
        function<TreeNode*(int, int, int)> build = [&](int a, int b, int c) -> TreeNode* {
            if (a > b) return nullptr;
            TreeNode* root = new TreeNode(preorder[a]);
            if (a == b) return root;
            int size = at[preorder[a + 1]] - c + 1;        // left subtree size
            root->left = build(a + 1, a + size, c);
            root->right = build(a + size + 1, b, c + size);
            return root;
        };
        return build(0, (int)preorder.size() - 1, 0);
    }
};
// @test
    vector<int> pre{1, 2, 4, 5, 3, 6, 7}, post{4, 5, 2, 6, 7, 3, 1};
    H::check(H::levelVec(Solution().constructFromPrePost(pre, post)), vector<int>{1, 2, 3, 4, 5, 6, 7}, "constructFromPrePost");
