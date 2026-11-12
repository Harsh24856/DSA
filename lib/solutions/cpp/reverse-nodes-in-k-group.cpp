class Solution {
public:
    ListNode* reverseKGroup(ListNode* head, int k) {
        ListNode dummy(0, head);
        ListNode* groupPrev = &dummy;
        while (true) {
            ListNode* kth = groupPrev;
            for (int i = 0; i < k; i++) {
                kth = kth->next;
                if (!kth) return dummy.next;               // fewer than k left: keep them as they are
            }
            ListNode* groupNext = kth->next;
            ListNode *prev = groupNext, *cur = groupPrev->next;
            while (cur != groupNext) {                     // reverse the group onto groupNext
                ListNode* nxt = cur->next;
                cur->next = prev;
                prev = cur;
                cur = nxt;
            }
            ListNode* first = groupPrev->next;             // now the group's last node
            groupPrev->next = kth;
            groupPrev = first;
        }
    }
};
// @test
    H::check(H::listVec(Solution().reverseKGroup(H::mkList({1, 2, 3, 4, 5}), 2)), vector<int>{2, 1, 4, 3, 5}, "k2");
    H::check(H::listVec(Solution().reverseKGroup(H::mkList({1, 2, 3, 4, 5}), 3)), vector<int>{3, 2, 1, 4, 5}, "k3");
