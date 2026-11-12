// trust the call: the rest of the list comes back reversed, then attach head at its end
ListNode* reverseList(ListNode* head) {
    if (!head || !head->next) return head;
    ListNode* newHead = reverseList(head->next);
    head->next->next = head;      // the next node points back at me
    head->next = nullptr;
    return newHead;
}
// @test
    H::check(H::listVec(reverseList(H::mkList({1, 2, 3, 4, 5}))), vector<int>{5, 4, 3, 2, 1}, "reverse");
    H::check(H::listVec(reverseList(H::mkList({1}))), vector<int>{1}, "single");
    H::check(H::listVec(reverseList(nullptr)), vector<int>{}, "empty");
