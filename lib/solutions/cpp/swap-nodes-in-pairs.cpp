class Solution {
public:
    ListNode* swapPairs(ListNode* head) {
        ListNode dummy(0, head);
        ListNode* prev = &dummy;
        while (prev->next && prev->next->next) {
            ListNode *a = prev->next, *b = a->next;
            prev->next = b;                                // prev -> b -> a -> rest
            a->next = b->next;
            b->next = a;
            prev = a;
        }
        return dummy.next;
    }
};
// @test
    H::check(H::listVec(Solution().swapPairs(H::mkList({1, 2, 3, 4}))), vector<int>{2, 1, 4, 3}, "a");
    H::check(H::listVec(Solution().swapPairs(nullptr)), vector<int>{}, "empty");
    H::check(H::listVec(Solution().swapPairs(H::mkList({1}))), vector<int>{1}, "one");
    H::check(H::listVec(Solution().swapPairs(H::mkList({1, 2, 3}))), vector<int>{2, 1, 3}, "odd");
