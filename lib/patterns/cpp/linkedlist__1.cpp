// Floyd: fast gains one node per step, so inside a cycle they meet; then head and the meeting point
// are the same distance from the cycle entry
ListNode* detectCycle(ListNode* head) {
    ListNode *slow = head, *fast = head;
    while (fast && fast->next) {                 // check both before taking two steps
        slow = slow->next;
        fast = fast->next->next;
        if (slow == fast) {                      // compare nodes, not values
            ListNode* p = head;
            while (p != slow) { p = p->next; slow = slow->next; }
            return p;                            // cycle entry
        }
    }
    return nullptr;
}
// @test
    ListNode* h = H::mkList({3, 2, 0, -4});
    h->next->next->next->next = h->next;         // tail points back to the node with 2
    H::check(detectCycle(h) == h->next, true, "entry at index 1");
    ListNode* one = H::mkList({1});
    one->next = one;
    H::check(detectCycle(one) == one, true, "self loop");
    H::check(detectCycle(H::mkList({1, 2, 3})) == nullptr, true, "no cycle");
    H::check(detectCycle(nullptr) == nullptr, true, "empty");
