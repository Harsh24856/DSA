class Solution {
    unordered_map<int, int> at;                              // value -> index in inorder
    vector<int> post;
    TreeNode* go(int lo, int hi) {
        if (lo > hi) return nullptr;
        int v = post.back(); post.pop_back();                // postorder from the end gives roots
        TreeNode* node = new TreeNode(v);
        node->right = go(at[v] + 1, hi);                     // right first, since we read backwards
        node->left = go(lo, at[v] - 1);
        return node;
    }
public:
    TreeNode* buildTree(vector<int>& inorder, vector<int>& postorder) {
        for (int i = 0; i < (int)inorder.size(); i++) at[inorder[i]] = i;
        post = postorder;
        return go(0, (int)inorder.size() - 1);
    }
};
// @test
    vector<int> in1 = {9, 3, 15, 20, 7}, po1 = {9, 15, 7, 20, 3};
    H::check(H::levelVec(Solution().buildTree(in1, po1)), vector<int>{3, 9, 20, NUL, NUL, 15, 7}, "in/post");
    vector<int> in2 = {-1}, po2 = {-1};
    H::check(H::levelVec(Solution().buildTree(in2, po2)), vector<int>{-1}, "in/post single");
