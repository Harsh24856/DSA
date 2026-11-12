class Solution {
public:
    vector<int> nodesBetweenCriticalPoints(ListNode* head) {
        int first = -1, last = -1, best = INT_MAX;
        ListNode *prev = head, *cur = head->next;
        for (int i = 1; cur->next; i++) {
            int nxt = cur->next->val;
            bool peak = prev->val < cur->val && cur->val > nxt;
            bool valley = prev->val > cur->val && cur->val < nxt;
            if (peak || valley) {
                if (first == -1) first = i;
                else best = min(best, i - last);       // closest pair is always adjacent
                last = i;
            }
            prev = cur;
            cur = cur->next;
        }
        if (first == last) return {-1, -1};           // fewer than two critical points
        return {best, last - first};
    }
};
