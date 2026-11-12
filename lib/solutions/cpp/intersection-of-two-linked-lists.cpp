class Solution {
public:
    ListNode* getIntersectionNode(ListNode* headA, ListNode* headB) {
        ListNode *a = headA, *b = headB;
        while (a != b) {                                 // each walks A then B, so both cover the same length
            a = a ? a->next : headB;
            b = b ? b->next : headA;
        }
        return a;
    }
};
// @test
    vector<tuple<vector<int>, vector<int>, vector<int>>> cases = {
        {{4, 1}, {5, 6, 1}, {8, 4, 5}}, {{1, 9, 1}, {3}, {2, 4}}, {{2, 6, 4}, {1, 5}, {}}};
    for (auto& [a, b, shared] : cases) {
        ListNode *s = H::mkList(shared), *A = H::mkList(a), *B = H::mkList(b);
        for (ListNode* x : {A, B}) {
            while (x->next) x = x->next;
            x->next = s;                                 // both lists end in the shared part
        }
        H::check(Solution().getIntersectionNode(A, B) == s, true, "getIntersectionNode");
    }
