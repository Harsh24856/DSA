class MyCalendar {
    vector<int> starts, ends;   // bookings sorted by start
public:
    MyCalendar() {}

    bool book(int start, int end) {
        int i = upper_bound(starts.begin(), starts.end(), start) - starts.begin();
        if (i && ends[i - 1] > start) return false;                  // overlaps the booking before
        if (i < (int)starts.size() && starts[i] < end) return false; // overlaps the booking after
        starts.insert(starts.begin() + i, start);
        ends.insert(ends.begin() + i, end);
        return true;
    }
};
// @test
    MyCalendar cal;
    vector<bool> got;
    for (auto [s, e] : vector<pair<int, int>>{{10, 20}, {15, 25}, {20, 30}, {5, 10}, {9, 11}}) got.push_back(cal.book(s, e));
    H::check(got, vector<bool>{true, false, true, true, false}, "MyCalendar");
