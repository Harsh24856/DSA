class Solution {
public:
    int pairSum(ListNode* head) {
        ListNode *slow = head, *fast = head;
        while (fast && fast->next) { slow = slow->next; fast = fast->next->next; }   // slow reaches the middle
        ListNode* prev = nullptr;
        while (slow) {                                   // reverse the second half
            ListNode* nxt = slow->next;
            slow->next = prev;
            prev = slow;
            slow = nxt;
        }
        int best = 0;
        for (; prev; head = head->next, prev = prev->next) best = max(best, head->val + prev->val);
        return best;
    }
};
