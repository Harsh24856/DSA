// k largest: a MIN-heap of size k; its top is the weakest winner, so it is the kth largest
int kthLargest(const vector<int>& nums, int k) {
    priority_queue<int, vector<int>, greater<int>> h;
    for (int x : nums) {
        h.push(x);
        if ((int)h.size() > k) h.pop();         // drop the smallest: it cannot be in the top k
    }
    return h.top();
}
// @test
    H::check(kthLargest({3, 2, 1, 5, 6, 4}, 2), 5, "k = 2");
    H::check(kthLargest({3, 2, 3, 1, 2, 4, 5, 5, 6}, 4), 4, "duplicates");
    H::check(kthLargest({1}, 1), 1, "one");
    H::check(kthLargest({5, 1, 9}, 3), 1, "k = n");
