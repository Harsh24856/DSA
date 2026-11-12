class Solution {
public:
    ListNode* deleteDuplicates(ListNode* head) {
        ListNode* cur = head;
        while (cur && cur->next) {
            if (cur->val == cur->next->val) cur->next = cur->next->next;   // skip the copy
            else cur = cur->next;
        }
        return head;
    }
};
// @test
    H::check(H::listVec(Solution().deleteDuplicates(H::mkList({1, 1, 2}))), vector<int>{1, 2}, "a");
    H::check(H::listVec(Solution().deleteDuplicates(H::mkList({1, 1, 2, 3, 3}))), vector<int>{1, 2, 3}, "b");
