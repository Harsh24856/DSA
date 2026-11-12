class Solution {
public:
    ListNode* reverseList(ListNode* head) {
        ListNode* prev = nullptr;
        while (head) {
            ListNode* nxt = head->next;
            head->next = prev;                         // point back
            prev = head;
            head = nxt;
        }
        return prev;
    }
};
// @test
    H::check(H::listVec(Solution().reverseList(H::mkList({1, 2, 3, 4, 5}))), vector<int>{5, 4, 3, 2, 1}, "a");
    H::check(H::listVec(Solution().reverseList(H::mkList({1, 2}))), vector<int>{2, 1}, "b");
    H::check(H::listVec(Solution().reverseList(nullptr)), vector<int>{}, "empty");
