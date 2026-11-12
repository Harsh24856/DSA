class Solution {
public:
    ListNode* removeZeroSumSublists(ListNode* head) {
        ListNode dummy(0, head);
        unordered_map<int, ListNode*> last;            // prefix sum -> last node with that sum
        int s = 0;
        for (ListNode* node = &dummy; node; node = node->next) { s += node->val; last[s] = node; }
        s = 0;
        for (ListNode* node = &dummy; node; node = node->next) {
            s += node->val;
            node->next = last[s]->next;                // skip everything that sums to zero
        }
        return dummy.next;
    }
};
// @test
    H::check(H::listVec(Solution().removeZeroSumSublists(H::mkList({1, 2, -3, 3, 1}))), vector<int>{3, 1}, "a");
    H::check(H::listVec(Solution().removeZeroSumSublists(H::mkList({1, 2, 3, -3, 4}))), vector<int>{1, 2, 4}, "b");
    H::check(H::listVec(Solution().removeZeroSumSublists(H::mkList({1, 2, 3, -3, -2}))), vector<int>{1}, "c");
