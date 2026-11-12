class Solution {
public:
    ListNode* reverseBetween(ListNode* head, int left, int right) {
        ListNode dummy(0, head);
        ListNode* prev = &dummy;
        for (int i = 0; i < left - 1; i++) prev = prev->next;   // node before the range
        ListNode* cur = prev->next;
        for (int i = 0; i < right - left; i++) {                // move cur's next to the front of the range
            ListNode* nxt = cur->next;
            cur->next = nxt->next;
            nxt->next = prev->next;
            prev->next = nxt;
        }
        return dummy.next;
    }
};
// @test
    H::check(H::listVec(Solution().reverseBetween(H::mkList({1, 2, 3, 4, 5}), 2, 4)), vector<int>{1, 4, 3, 2, 5}, "a");
    H::check(H::listVec(Solution().reverseBetween(H::mkList({5}), 1, 1)), vector<int>{5}, "b");
