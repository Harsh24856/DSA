class Solution {
public:
    ListNode* middleNode(ListNode* head) {
        ListNode *slow = head, *fast = head;
        while (fast && fast->next) {          // fast moves two steps for each step of slow
            slow = slow->next;
            fast = fast->next->next;
        }
        return slow;
    }
};
// @test
    H::check(H::listVec(Solution().middleNode(H::mkList({1, 2, 3, 4, 5}))), vector<int>{3, 4, 5}, "odd");
    H::check(H::listVec(Solution().middleNode(H::mkList({1, 2, 3, 4, 5, 6}))), vector<int>{4, 5, 6}, "even");
