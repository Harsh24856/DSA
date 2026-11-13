class Solution {
public:
    ListNode* oddEvenList(ListNode* head) {
        if (!head) return head;
        ListNode *odd = head, *even = head->next, *evenHead = even;
        while (even && even->next) {
            odd->next = even->next;          // link the next odd node
            odd = odd->next;
            even->next = odd->next;          // link the next even node
            even = even->next;
        }
        odd->next = evenHead;                // odd chain, then the even chain
        return head;
    }
};
// @test
    H::check(H::listVec(Solution().oddEvenList(H::mkList({1, 2, 3, 4, 5}))), vector<int>{1, 3, 5, 2, 4}, "a");
    H::check(H::listVec(Solution().oddEvenList(H::mkList({2, 1, 3, 5, 6, 4, 7}))), vector<int>{2, 3, 6, 7, 1, 5, 4}, "b");
    H::check(H::listVec(Solution().oddEvenList(H::mkList({}))), vector<int>{}, "empty");
    H::check(H::listVec(Solution().oddEvenList(H::mkList({1}))), vector<int>{1}, "one");
    H::check(H::listVec(Solution().oddEvenList(H::mkList({1, 2}))), vector<int>{1, 2}, "two");
