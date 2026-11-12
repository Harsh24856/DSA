class Solution {
public:
    ListNode* sortList(ListNode* head) {
        if (!head || !head->next) return head;
        ListNode *slow = head, *fast = head->next;
        while (fast && fast->next) { slow = slow->next; fast = fast->next->next; }
        ListNode* mid = slow->next;
        slow->next = nullptr;                                // cut the list in two halves
        ListNode *a = sortList(head), *b = sortList(mid);
        ListNode dummy, *tail = &dummy;
        while (a && b) {
            if (a->val <= b->val) { tail->next = a; a = a->next; }
            else { tail->next = b; b = b->next; }
            tail = tail->next;
        }
        tail->next = a ? a : b;
        return dummy.next;
    }
};
// @test
    for (vector<int> a : {vector<int>{4, 2, 1, 3}, vector<int>{-1, 5, 3, 4, 0}, vector<int>{}})
        H::check(H::listVec(Solution().sortList(H::mkList(a))), H::sorted(a), "sortList " + H::str(a));
