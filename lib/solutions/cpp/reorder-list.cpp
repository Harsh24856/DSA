class Solution {
public:
    void reorderList(ListNode* head) {
        ListNode *slow = head, *fast = head;
        while (fast->next && fast->next->next) { slow = slow->next; fast = fast->next->next; }
        ListNode* second = slow->next;
        slow->next = nullptr;                          // split after the middle
        ListNode* prev = nullptr;
        while (second) {                               // reverse the second half
            ListNode* nxt = second->next;
            second->next = prev;
            prev = second;
            second = nxt;
        }
        ListNode* first = head;
        second = prev;
        while (second) {                               // weave: one from each half
            ListNode *n1 = first->next, *n2 = second->next;
            first->next = second;
            second->next = n1;
            first = n1;
            second = n2;
        }
    }
};
// @test
    for (auto [a, exp] : vector<pair<vector<int>, vector<int>>>{{{1, 2, 3, 4}, {1, 4, 2, 3}}, {{1, 2, 3, 4, 5}, {1, 5, 2, 4, 3}}, {{1}, {1}}}) {
        ListNode* x = H::mkList(a);
        Solution().reorderList(x);
        H::check(H::listVec(x), exp, "reorderList");
    }
