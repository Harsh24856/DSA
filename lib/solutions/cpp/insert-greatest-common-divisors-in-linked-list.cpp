class Solution {
public:
    ListNode* insertGreatestCommonDivisors(ListNode* head) {
        for (ListNode* node = head; node->next; node = node->next->next)   // skip the new node
            node->next = new ListNode(gcd(node->val, node->next->val), node->next);
        return head;
    }
};
// @test
    H::check(H::listVec(Solution().insertGreatestCommonDivisors(H::mkList({18, 6, 10, 3}))), vector<int>{18, 6, 6, 2, 10, 1, 3}, "insertGCD a");
    H::check(H::listVec(Solution().insertGreatestCommonDivisors(H::mkList({7}))), vector<int>{7}, "insertGCD b");
