class Solution {
public:
    ListNode* addTwoNumbers(ListNode* l1, ListNode* l2) {
        vector<int> a, b;   // digits as stacks, so we can add from the back
        for (; l1; l1 = l1->next) a.push_back(l1->val);
        for (; l2; l2 = l2->next) b.push_back(l2->val);
        ListNode* head = nullptr;
        int carry = 0;
        while (!a.empty() || !b.empty() || carry) {
            int s = carry;
            if (!a.empty()) { s += a.back(); a.pop_back(); }
            if (!b.empty()) { s += b.back(); b.pop_back(); }
            carry = s / 10;
            head = new ListNode(s % 10, head);   // build the answer front first
        }
        return head;
    }
};
// @test
    H::check(H::listVec(Solution().addTwoNumbers(H::mkList({7, 2, 4, 3}), H::mkList({5, 6, 4}))), vector<int>{7, 8, 0, 7}, "a");
    H::check(H::listVec(Solution().addTwoNumbers(H::mkList({2, 4, 3}), H::mkList({5, 6, 4}))), vector<int>{8, 0, 7}, "b");
    H::check(H::listVec(Solution().addTwoNumbers(H::mkList({0}), H::mkList({0}))), vector<int>{0}, "c");
    H::check(H::listVec(Solution().addTwoNumbers(H::mkList({9, 9}), H::mkList({1}))), vector<int>{1, 0, 0}, "d");
