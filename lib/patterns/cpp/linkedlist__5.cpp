// sorted list: splice out a node equal to the current one; advance only when the next value differs
ListNode* deleteDuplicates(ListNode* head) {
    for (ListNode* curr = head; curr && curr->next; ) {
        if (curr->next->val == curr->val) curr->next = curr->next->next;   // stay put: a run can be longer
        else curr = curr->next;
    }
    return head;
}
// @test
    H::check(H::listVec(deleteDuplicates(H::mkList({1, 1, 2}))), vector<int>{1, 2}, "pair");
    H::check(H::listVec(deleteDuplicates(H::mkList({1, 1, 2, 3, 3, 3, 4}))), vector<int>{1, 2, 3, 4}, "run of three");
    H::check(H::listVec(deleteDuplicates(nullptr)), vector<int>{}, "empty");
