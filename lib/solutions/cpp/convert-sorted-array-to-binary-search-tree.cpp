class Solution {
    TreeNode* go(const vector<int>& nums, int lo, int hi) {
        if (lo > hi) return nullptr;
        int mid = (lo + hi) / 2;                             // middle value as root keeps it balanced
        TreeNode* node = new TreeNode(nums[mid]);
        node->left = go(nums, lo, mid - 1);
        node->right = go(nums, mid + 1, hi);
        return node;
    }
public:
    TreeNode* sortedArrayToBST(vector<int>& nums) {
        return go(nums, 0, (int)nums.size() - 1);
    }
};
// @test
    for (vector<int> a : {vector<int>{-10, -3, 0, 5, 9}, vector<int>{1, 3}}) {
        TreeNode* r = Solution().sortedArrayToBST(a);
        H::check(H::inorderVec(r), a, "sortedArrayToBST inorder " + H::str(a));
        H::check(H::balanced(r), true, "sortedArrayToBST balanced " + H::str(a));
    }
