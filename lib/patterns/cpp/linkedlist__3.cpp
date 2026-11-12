// merge two sorted lists behind a dummy node; attach the smaller head, then the leftover tail
ListNode* mergeTwo(ListNode* a, ListNode* b) {
    ListNode dummy, *tail = &dummy;
    while (a && b) {
        if (a->val <= b->val) { tail->next = a; a = a->next; }   // <= keeps it stable
        else { tail->next = b; b = b->next; }
        tail = tail->next;
    }
    tail->next = a ? a : b;
    return dummy.next;
}
// @test
    H::check(H::listVec(mergeTwo(H::mkList({1, 2, 4}), H::mkList({1, 3, 4}))), vector<int>{1, 1, 2, 3, 4, 4}, "classic");
    H::check(H::listVec(mergeTwo(nullptr, nullptr)), vector<int>{}, "both empty");
    H::check(H::listVec(mergeTwo(nullptr, H::mkList({0}))), vector<int>{0}, "one empty");
