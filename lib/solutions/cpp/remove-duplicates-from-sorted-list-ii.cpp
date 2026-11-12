class Solution {
public:
    ListNode* deleteDuplicates(ListNode* head) {
        ListNode dummy(0, head);
        ListNode* prev = &dummy;                       // last node kept
        while (head) {
            if (head->next && head->val == head->next->val) {
                while (head->next && head->val == head->next->val) head = head->next;
                prev->next = head->next;               // cut out the whole run
            } else {
                prev = prev->next;
            }
            head = head->next;
        }
        return dummy.next;
    }
};
// @test
    H::check(H::listVec(Solution().deleteDuplicates(H::mkList({1, 2, 3, 3, 4, 4, 5}))), vector<int>{1, 2, 5}, "a");
    H::check(H::listVec(Solution().deleteDuplicates(H::mkList({1, 1, 1, 2, 3}))), vector<int>{2, 3}, "b");
