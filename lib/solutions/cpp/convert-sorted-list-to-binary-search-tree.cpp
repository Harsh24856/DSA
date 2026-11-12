class Solution {
public:
    TreeNode* sortedListToBST(ListNode* head) {
        vector<int> vals;
        for (; head; head = head->next) vals.push_back(head->val);
        function<TreeNode*(int, int)> build = [&](int lo, int hi) -> TreeNode* {
            if (lo > hi) return nullptr;
            int mid = (lo + hi) / 2;                       // middle value as root keeps it balanced
            TreeNode* node = new TreeNode(vals[mid]);
            node->left = build(lo, mid - 1);
            node->right = build(mid + 1, hi);
            return node;
        };
        return build(0, (int)vals.size() - 1);
    }
};
// @test
    TreeNode* r = Solution().sortedListToBST(H::mkList({-10, -3, 0, 5, 9}));
    H::check(H::inorderVec(r), vector<int>{-10, -3, 0, 5, 9}, "inorder");
    H::check(H::balanced(r), true, "balanced");
