// running median: lo is a max-heap of the smaller half, hi a min-heap of the larger half, |lo| = |hi| or |hi| + 1
class MedianFinder {
    priority_queue<int> lo;
    priority_queue<int, vector<int>, greater<int>> hi;
public:
    void addNum(int x) {
        lo.push(x);
        hi.push(lo.top()); lo.pop();             // pass through lo so every lo value stays <= every hi value
        if (hi.size() > lo.size()) { lo.push(hi.top()); hi.pop(); }
    }
    double findMedian() const {
        if (lo.size() > hi.size()) return lo.top();
        return ((double)lo.top() + hi.top()) / 2;   // double first: the sum of two ints can overflow
    }
};
// @test
    MedianFinder m;
    m.addNum(1); m.addNum(2);
    H::checkNear(m.findMedian(), 1.5, "1 2");
    m.addNum(3);
    H::checkNear(m.findMedian(), 2.0, "1 2 3");
    MedianFinder n;
    for (int x : {5, 15, 1, 3}) n.addNum(x);
    H::checkNear(n.findMedian(), 4.0, "5 15 1 3");
    MedianFinder big;
    big.addNum(INT_MAX); big.addNum(INT_MAX);
    H::checkNear(big.findMedian(), (double)INT_MAX, "no overflow");
