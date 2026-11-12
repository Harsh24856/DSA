class Solution {
public:
    ListNode* partition(ListNode* head, int x) {
        ListNode small, big;                          // dummy heads of the two lists
        ListNode *s = &small, *b = &big;
        while (head) {
            if (head->val < x) { s->next = head; s = s->next; }
            else { b->next = head; b = b->next; }
            head = head->next;
        }
        b->next = nullptr;                            // end the big list
        s->next = big.next;                           // small list, then big list
        return small.next;
    }
};
// @test
    H::check(H::listVec(Solution().partition(H::mkList({1, 4, 3, 2, 5, 2}), 3)), vector<int>{1, 2, 2, 4, 3, 5}, "a");
    H::check(H::listVec(Solution().partition(H::mkList({2, 1}), 2)), vector<int>{1, 2}, "b");
