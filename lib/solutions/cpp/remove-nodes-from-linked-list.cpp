class Solution {
public:
    ListNode* removeNodes(ListNode* head) {
        vector<ListNode*> st;                          // values never rising
        for (; head; head = head->next) {
            while (!st.empty() && st.back()->val < head->val) st.pop_back();
            st.push_back(head);
        }
        for (size_t i = 0; i + 1 < st.size(); i++) st[i]->next = st[i + 1];   // relink what is left
        st.back()->next = nullptr;
        return st[0];
    }
};
// @test
    H::check(H::listVec(Solution().removeNodes(H::mkList({5, 2, 13, 3, 8}))), vector<int>{13, 8}, "a");
    H::check(H::listVec(Solution().removeNodes(H::mkList({1, 1, 1, 1}))), vector<int>{1, 1, 1, 1}, "b");
