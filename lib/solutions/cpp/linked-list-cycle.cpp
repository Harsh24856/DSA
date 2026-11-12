class Solution {
public:
    bool hasCycle(ListNode* head) {
        ListNode *slow = head, *fast = head;
        while (fast && fast->next) {
            slow = slow->next;
            fast = fast->next->next;
            if (slow == fast) return true;               // the fast pointer lapped the slow one
        }
        return false;
    }
};
// @test
    auto cycle = [](vector<int> vals, int pos) {         // tail links back to node pos (-1 for none)
        ListNode* head = H::mkList(vals);
        ListNode *tail = head, *at = nullptr;
        for (int k = 0; tail; k++) {
            if (k == pos) at = tail;
            if (!tail->next) break;
            tail = tail->next;
        }
        if (at) tail->next = at;
        return head;
    };
    H::check(Solution().hasCycle(cycle({3, 2, 0, -4}, 1)), true, "hasCycle 1");
    H::check(Solution().hasCycle(cycle({1, 2}, 0)), true, "hasCycle 2");
    H::check(Solution().hasCycle(cycle({1}, -1)), false, "hasCycle 3");
