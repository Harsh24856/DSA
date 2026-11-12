class MyCalendarTwo {
    vector<pair<int, int>> booked, overlaps;   // overlaps: ranges already booked twice

public:
    MyCalendarTwo() {}

    bool book(int start, int end) {
        for (auto [s, e] : overlaps)
            if (start < e && s < end) return false;   // would be a triple booking
        for (auto [s, e] : booked)
            if (start < e && s < end) overlaps.push_back({max(s, start), min(e, end)});
        booked.push_back({start, end});
        return true;
    }
};
// @test
    MyCalendarTwo c;
    vector<bool> got;
    for (auto [a, b] : vector<pair<int, int>>{{10, 20}, {50, 60}, {10, 40}, {5, 15}, {5, 10}, {25, 55}}) got.push_back(c.book(a, b));
    H::check(got, vector<bool>{true, true, true, false, true, true}, "MyCalendarTwo");
