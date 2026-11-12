class Solution {
public:
    ListNode* deleteMiddle(ListNode* head) {
        if (!head->next) return nullptr;
        ListNode *slow = head, *fast = head->next->next;   // fast starts ahead so slow stops before the middle
        while (fast && fast->next) {
            slow = slow->next;
            fast = fast->next->next;
        }
        slow->next = slow->next->next;
        return head;
    }
};
// @test
    for (auto& [a, e] : vector<pair<vector<int>, vector<int>>>{{{1, 3, 4, 7, 1, 2, 6}, {1, 3, 4, 1, 2, 6}}, {{1, 2, 3, 4}, {1, 2, 4}}, {{2, 1}, {2}}, {{1}, {}}})
        H::check(H::listVec(Solution().deleteMiddle(H::mkList(a))), e, "deleteMiddle " + H::str(a));
