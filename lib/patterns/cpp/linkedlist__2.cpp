// reverse in place: save next, point curr back at prev, step both forward
ListNode* reverseList(ListNode* head) {
    ListNode *prev = nullptr, *curr = head;
    while (curr) {
        ListNode* nxt = curr->next;              // save before overwriting
        curr->next = prev;
        prev = curr;
        curr = nxt;
    }
    return prev;
}
// @test
    H::check(H::listVec(reverseList(H::mkList({1, 2, 3, 4, 5}))), vector<int>{5, 4, 3, 2, 1}, "five");
    H::check(H::listVec(reverseList(H::mkList({1, 2}))), vector<int>{2, 1}, "two");
    H::check(H::listVec(reverseList(nullptr)), vector<int>{}, "empty");
