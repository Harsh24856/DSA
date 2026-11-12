class MedianFinder {
    priority_queue<int> lo;                              // smaller half, max-heap
    priority_queue<int, vector<int>, greater<int>> hi;   // larger half, min-heap

public:
    MedianFinder() {}

    void addNum(int num) {
        lo.push(num);
        hi.push(lo.top()); lo.pop();                     // the largest of the small half moves up
        if (hi.size() > lo.size()) { lo.push(hi.top()); hi.pop(); }   // lo keeps the extra one
    }

    double findMedian() {
        if (lo.size() > hi.size()) return lo.top();
        return (lo.top() + (double)hi.top()) / 2;
    }
};
// @test
    MedianFinder m;
    m.addNum(1); m.addNum(2);
    H::checkNear(m.findMedian(), 1.5, "MedianFinder 1");
    m.addNum(3);
    H::checkNear(m.findMedian(), 2.0, "MedianFinder 2");
