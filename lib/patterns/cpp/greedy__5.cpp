// Huffman-style: always merge the two smallest sticks
long long connectSticks(const vector<int>& sticks) {
    priority_queue<long long, vector<long long>, greater<>> h(sticks.begin(), sticks.end());
    long long cost = 0;
    while (h.size() > 1) {
        long long a = h.top(); h.pop();
        long long b = h.top(); h.pop();
        cost += a + b;
        h.push(a + b);
    }
    return cost;
}
// @test
    H::check(connectSticks({2, 4, 3}), 14LL, "connect sticks");
    H::check(connectSticks({1, 8, 3, 5}), 30LL, "connect sticks 2");
    H::check(connectSticks({5}), 0LL, "one stick");
