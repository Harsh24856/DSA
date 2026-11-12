class Solution {
public:
    ListNode* removeNthFromEnd(ListNode* head, int n) {
        ListNode dummy(0, head);
        ListNode *fast = &dummy, *slow = &dummy;
        for (int i = 0; i < n; i++) fast = fast->next;     // open a gap of n nodes
        while (fast->next) { fast = fast->next; slow = slow->next; }
        slow->next = slow->next->next;                     // slow sits just before the target
        return dummy.next;
    }
};
// @test
    H::check(H::listVec(Solution().removeNthFromEnd(H::mkList({1, 2, 3, 4, 5}), 2)), vector<int>{1, 2, 3, 5}, "a");
    H::check(H::listVec(Solution().removeNthFromEnd(H::mkList({1}), 1)), vector<int>{}, "b");
    H::check(H::listVec(Solution().removeNthFromEnd(H::mkList({1, 2}), 1)), vector<int>{1}, "c");
