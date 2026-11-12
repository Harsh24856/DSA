class Solution {
public:
    ListNode* detectCycle(ListNode* head) {
        ListNode *slow = head, *fast = head;
        while (fast && fast->next) {
            slow = slow->next;
            fast = fast->next->next;
            if (slow == fast) {
                // head and the meeting point are the same distance from the cycle start
                slow = head;
                while (slow != fast) {
                    slow = slow->next;
                    fast = fast->next;
                }
                return slow;
            }
        }
        return nullptr;
    }
};
// @test
    auto run = [](vector<int> v, int pos) {
        ListNode* head = H::mkList(v);
        vector<ListNode*> nodes;
        for (ListNode* c = head; c; c = c->next) nodes.push_back(c);
        if (pos >= 0) nodes.back()->next = nodes[pos];
        ListNode* r = Solution().detectCycle(head);
        return r ? (int)(find(nodes.begin(), nodes.end(), r) - nodes.begin()) : -1;
    };
    H::check(run({3, 2, 0, -4}, 1), 1, "a");
    H::check(run({1, 2}, 0), 0, "b");
    H::check(run({1}, -1), -1, "c");
