class Solution {
public:
    ListNode* removeElements(ListNode* head, int val) {
        ListNode dummy(0, head);
        ListNode* cur = &dummy;
        while (cur->next) {
            if (cur->next->val == val) cur->next = cur->next->next;   // skip it; cur stays
            else cur = cur->next;
        }
        return dummy.next;
    }
};
// @test
    H::check(H::listVec(Solution().removeElements(H::mkList({1, 2, 6, 3, 4, 5, 6}), 6)), vector<int>{1, 2, 3, 4, 5}, "a");
    H::check(H::listVec(Solution().removeElements(H::mkList({}), 1)), vector<int>{}, "empty");
    H::check(H::listVec(Solution().removeElements(H::mkList({7, 7, 7, 7}), 7)), vector<int>{}, "all");
    H::check(H::listVec(Solution().removeElements(H::mkList({1, 2, 2, 1}), 2)), vector<int>{1, 1}, "middle");
