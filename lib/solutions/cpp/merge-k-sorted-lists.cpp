class Solution {
public:
    ListNode* mergeKLists(vector<ListNode*>& lists) {
        // (value, list index, node): the index breaks ties so nodes are never compared
        using Item = tuple<int, int, ListNode*>;
        priority_queue<Item, vector<Item>, greater<Item>> heap;
        for (int i = 0; i < (int)lists.size(); i++) if (lists[i]) heap.push({lists[i]->val, i, lists[i]});
        ListNode dummy, *tail = &dummy;
        while (!heap.empty()) {
            auto [v, i, node] = heap.top(); heap.pop();  // smallest head of all lists
            tail->next = node;
            tail = node;
            if (node->next) heap.push({node->next->val, i, node->next});
        }
        return dummy.next;
    }
};
// @test
    vector<pair<vector<vector<int>>, vector<int>>> cases = {
        {{{1, 4, 5}, {1, 3, 4}, {2, 6}}, {1, 1, 2, 3, 4, 4, 5, 6}}, {{}, {}}, {{{}}, {}}};
    for (auto& [ls, exp] : cases) {
        vector<ListNode*> lists;
        for (auto& x : ls) lists.push_back(H::mkList(x));
        H::check(H::listVec(Solution().mergeKLists(lists)), exp, "mergeKLists");
    }
