// greedy with a max-heap: smash the two heaviest, push back the difference
int lastStoneWeight(const vector<int>& stones) {
    priority_queue<int> h(stones.begin(), stones.end());      // heapify in O(n)
    while (h.size() > 1) {
        int a = h.top(); h.pop();
        int b = h.top(); h.pop();
        if (a != b) h.push(a - b);
    }
    return h.empty() ? 0 : h.top();
}
// @test
    H::check(lastStoneWeight({2, 7, 4, 1, 8, 1}), 1, "classic");
    H::check(lastStoneWeight({1}), 1, "one");
    H::check(lastStoneWeight({2, 2}), 0, "both destroyed");
