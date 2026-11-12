class Solution {
public:
    ListNode* doubleIt(ListNode* head) {
        if (head->val >= 5) head = new ListNode(0, head);   // the carry needs a new first digit
        for (ListNode* c = head; c; c = c->next) {
            c->val = c->val * 2 % 10;
            if (c->next && c->next->val >= 5) c->val++;       // carry in from the next digit
        }
        return head;
    }
};
// @test
    H::check(H::listVec(Solution().doubleIt(H::mkList({1, 8, 9}))), vector<int>{3, 7, 8}, "189");
    H::check(H::listVec(Solution().doubleIt(H::mkList({9, 9, 9}))), vector<int>{1, 9, 9, 8}, "999");
