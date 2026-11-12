class Solution {
public:
    ListNode* addTwoNumbers(ListNode* l1, ListNode* l2) {
        ListNode dummy, *cur = &dummy;
        int carry = 0;
        while (l1 || l2 || carry) {                      // digits are stored lowest first
            int total = carry + (l1 ? l1->val : 0) + (l2 ? l2->val : 0);
            carry = total / 10;
            cur->next = new ListNode(total % 10);
            cur = cur->next;
            l1 = l1 ? l1->next : nullptr;
            l2 = l2 ? l2->next : nullptr;
        }
        return dummy.next;
    }
};
// @test
    H::check(H::listVec(Solution().addTwoNumbers(H::mkList({2, 4, 3}), H::mkList({5, 6, 4}))), vector<int>{7, 0, 8}, "addTwoNumbers 1");
    H::check(H::listVec(Solution().addTwoNumbers(H::mkList({0}), H::mkList({0}))), vector<int>{0}, "addTwoNumbers 2");
    H::check(H::listVec(Solution().addTwoNumbers(H::mkList({9, 9, 9, 9, 9, 9, 9}), H::mkList({9, 9, 9, 9}))), vector<int>{8, 9, 9, 9, 0, 0, 0, 1}, "addTwoNumbers 3");
