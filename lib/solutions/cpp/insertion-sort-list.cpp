class Solution {
public:
    ListNode* insertionSortList(ListNode* head) {
        ListNode dummy;                      // head of the sorted part
        ListNode* cur = head;
        while (cur) {
            ListNode* nxt = cur->next;
            ListNode* prev = &dummy;
            while (prev->next && prev->next->val < cur->val) prev = prev->next;   // where cur belongs
            cur->next = prev->next;
            prev->next = cur;
            cur = nxt;
        }
        return dummy.next;
    }
};
// @test
    H::check(H::listVec(Solution().insertionSortList(H::mkList({4, 2, 1, 3}))), vector<int>{1, 2, 3, 4}, "a");
    H::check(H::listVec(Solution().insertionSortList(H::mkList({-1, 5, 3, 4, 0}))), vector<int>{-1, 0, 3, 4, 5}, "b");
    H::check(H::listVec(Solution().insertionSortList(H::mkList({1}))), vector<int>{1}, "one");
    H::check(H::listVec(Solution().insertionSortList(H::mkList({3, 3, 1, 3}))), vector<int>{1, 3, 3, 3}, "duplicates");
