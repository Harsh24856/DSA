class Solution {
public:
    ListNode* mergeTwoLists(ListNode* list1, ListNode* list2) {
        ListNode dummy, *tail = &dummy;
        while (list1 && list2) {
            if (list1->val <= list2->val) { tail->next = list1; list1 = list1->next; }   // take the smaller head
            else { tail->next = list2; list2 = list2->next; }
            tail = tail->next;
        }
        tail->next = list1 ? list1 : list2;              // attach whatever is left
        return dummy.next;
    }
};
// @test
    H::check(H::listVec(Solution().mergeTwoLists(H::mkList({1, 2, 4}), H::mkList({1, 3, 4}))), vector<int>{1, 1, 2, 3, 4, 4}, "mergeTwoLists 1");
    H::check(H::listVec(Solution().mergeTwoLists(H::mkList({}), H::mkList({}))), vector<int>{}, "mergeTwoLists 2");
    H::check(H::listVec(Solution().mergeTwoLists(H::mkList({}), H::mkList({0}))), vector<int>{0}, "mergeTwoLists 3");
