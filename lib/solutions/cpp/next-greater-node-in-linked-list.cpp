class Solution {
public:
    vector<int> nextLargerNodes(ListNode* head) {
        vector<int> vals;
        for (; head; head = head->next) vals.push_back(head->val);
        vector<int> ans(vals.size(), 0);
        stack<int> st;                                   // indexes still waiting for a larger value
        for (int i = 0; i < (int)vals.size(); i++) {
            while (!st.empty() && vals[st.top()] < vals[i]) { ans[st.top()] = vals[i]; st.pop(); }
            st.push(i);
        }
        return ans;
    }
};
