class Solution {
public:
    ListNode* mergeInBetween(ListNode* list1, int a, int b, ListNode* list2) {
        ListNode* before = list1;
        for (int i = 0; i < a - 1; i++) before = before->next;      // node a - 1
        ListNode* after = before;
        for (int i = 0; i < b - a + 2; i++) after = after->next;    // node b + 1
        before->next = list2;
        while (list2->next) list2 = list2->next;
        list2->next = after;
        return list1;
    }
};
// @test
    H::check(H::listVec(Solution().mergeInBetween(H::mkList({10, 1, 13, 6, 9, 5}), 3, 4, H::mkList({1000000, 1000001, 1000002}))),
             vector<int>{10, 1, 13, 1000000, 1000001, 1000002, 5}, "mergeInBetween a");
    H::check(H::listVec(Solution().mergeInBetween(H::mkList({0, 1, 2, 3, 4, 5, 6}), 2, 5, H::mkList({1000000, 1000001, 1000002, 1000003, 1000004}))),
             vector<int>{0, 1, 1000000, 1000001, 1000002, 1000003, 1000004, 6}, "mergeInBetween b");
