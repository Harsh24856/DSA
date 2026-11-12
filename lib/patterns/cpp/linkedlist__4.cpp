ListNode* reverseList(ListNode* head) {
    ListNode* prev = nullptr;
    while (head) { ListNode* nxt = head->next; head->next = prev; prev = head; head = nxt; }
    return prev;
}

// reorder L0 Ln L1 Ln-1 ...: find the middle, reverse the second half, weave the halves
void reorderList(ListNode* head) {
    if (!head) return;
    ListNode *slow = head, *fast = head;
    while (fast && fast->next) { slow = slow->next; fast = fast->next->next; }
    ListNode* second = reverseList(slow->next);
    slow->next = nullptr;                        // cut, or the weave makes a cycle
    for (ListNode* first = head; second; ) {
        ListNode *a = first->next, *b = second->next;
        first->next = second;
        second->next = a;
        first = a;
        second = b;
    }
}
// @test
    ListNode* a = H::mkList({1, 2, 3, 4});
    reorderList(a);
    H::check(H::listVec(a), vector<int>{1, 4, 2, 3}, "even length");
    ListNode* b = H::mkList({1, 2, 3, 4, 5});
    reorderList(b);
    H::check(H::listVec(b), vector<int>{1, 5, 2, 4, 3}, "odd length");
    ListNode* c = H::mkList({1});
    reorderList(c);
    H::check(H::listVec(c), vector<int>{1}, "one node");
    reorderList(nullptr);
