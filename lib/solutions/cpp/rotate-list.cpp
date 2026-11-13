class Solution {
public:
    ListNode* rotateRight(ListNode* head, int k) {
        if (!head || !head->next) return head;
        int n = 1;
        ListNode* tail = head;
        while (tail->next) { tail = tail->next; n++; }   // length and the old tail
        k %= n;
        if (k == 0) return head;
        tail->next = head;                               // close the ring
        ListNode* newTail = head;
        for (int i = 0; i < n - k - 1; i++) newTail = newTail->next;
        ListNode* newHead = newTail->next;
        newTail->next = nullptr;                         // cut it open again
        return newHead;
    }
};
// @test
    H::check(H::listVec(Solution().rotateRight(H::mkList({1, 2, 3, 4, 5}), 2)), vector<int>{4, 5, 1, 2, 3}, "a");
    H::check(H::listVec(Solution().rotateRight(H::mkList({0, 1, 2}), 4)), vector<int>{2, 0, 1}, "b");
    H::check(H::listVec(Solution().rotateRight(H::mkList({}), 0)), vector<int>{}, "empty");
    H::check(H::listVec(Solution().rotateRight(H::mkList({1}), 99)), vector<int>{1}, "one");
    H::check(H::listVec(Solution().rotateRight(H::mkList({1, 2, 3}), 3)), vector<int>{1, 2, 3}, "k = n");
