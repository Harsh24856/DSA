class SeatManager {
    priority_queue<int, vector<int>, greater<int>> freed;   // seats given back
    int next = 1;                                           // seats from here on were never taken
public:
    SeatManager(int n) {}

    int reserve() {
        if (!freed.empty()) {
            int s = freed.top();
            freed.pop();
            return s;
        }
        return next++;
    }

    void unreserve(int seatNumber) { freed.push(seatNumber); }
};
// @test
    SeatManager m(5);
    vector<int> got;
    got.push_back(m.reserve()); got.push_back(m.reserve());
    m.unreserve(2);
    for (int k = 0; k < 4; k++) got.push_back(m.reserve());
    m.unreserve(5);
    H::check(got, vector<int>{1, 2, 2, 3, 4, 5}, "example");
    SeatManager s(3);
    s.reserve(); s.reserve(); s.reserve();
    s.unreserve(3); s.unreserve(1);
    H::check(s.reserve(), 1, "smallest returned first");
    H::check(s.reserve(), 3, "then the next");
