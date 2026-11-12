// k-way merge: the heap holds the current head of every list; pop the smallest, push its successor
ListNode* mergeKLists(vector<ListNode*>& lists) {
    auto cmp = [](ListNode* a, ListNode* b) { return a->val > b->val; };   // min-heap by value
    priority_queue<ListNode*, vector<ListNode*>, decltype(cmp)> h(cmp);
    for (ListNode* l : lists) if (l) h.push(l);
    ListNode dummy, *tail = &dummy;
    while (!h.empty()) {
        ListNode* node = h.top(); h.pop();
        tail = tail->next = node;
        if (node->next) h.push(node->next);
    }
    return dummy.next;
}
// @test
    vector<ListNode*> a{H::mkList({1, 4, 5}), H::mkList({1, 3, 4}), H::mkList({2, 6})};
    H::check(H::listVec(mergeKLists(a)), vector<int>{1, 1, 2, 3, 4, 4, 5, 6}, "three lists");
    vector<ListNode*> b;
    H::check(H::listVec(mergeKLists(b)), vector<int>{}, "no lists");
    vector<ListNode*> c{nullptr, H::mkList({2})};
    H::check(H::listVec(mergeKLists(c)), vector<int>{2}, "an empty list inside");
