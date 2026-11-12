class Solution {
    unordered_map<int, int> at;                              // value -> index in inorder
    int next = 0;                                            // next root in preorder
    TreeNode* go(const vector<int>& preorder, int lo, int hi) {
        if (lo > hi) return nullptr;
        int v = preorder[next++];
        TreeNode* node = new TreeNode(v);
        node->left = go(preorder, lo, at[v] - 1);
        node->right = go(preorder, at[v] + 1, hi);
        return node;
    }
public:
    TreeNode* buildTree(vector<int>& preorder, vector<int>& inorder) {
        for (int i = 0; i < (int)inorder.size(); i++) at[inorder[i]] = i;
        return go(preorder, 0, (int)inorder.size() - 1);
    }
};
// @test
    vector<int> pre1 = {3, 9, 20, 15, 7}, in1 = {9, 3, 15, 20, 7};
    H::check(H::levelVec(Solution().buildTree(pre1, in1)), vector<int>{3, 9, 20, NUL, NUL, 15, 7}, "pre/in");
    vector<int> pre2 = {-1}, in2 = {-1};
    H::check(H::levelVec(Solution().buildTree(pre2, in2)), vector<int>{-1}, "pre/in single");
