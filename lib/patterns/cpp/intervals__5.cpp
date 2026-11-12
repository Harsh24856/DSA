// online booking: a sorted map start -> end; a new [s, e) can only clash with its two neighbours
class MyCalendar {
    map<int, int> booked;                        // half-open bookings [start, end)
public:
    bool book(int s, int e) {
        auto next = booked.lower_bound(s);       // first booking starting at or after s
        if (next != booked.end() && next->first < e) return false;
        if (next != booked.begin() && prev(next)->second > s) return false;
        booked[s] = e;
        return true;
    }
};
// @test
    MyCalendar c;
    H::check(c.book(10, 20), true, "first");
    H::check(c.book(15, 25), false, "overlaps the end");
    H::check(c.book(20, 30), true, "touching is fine");
    H::check(c.book(5, 10), true, "fits before");
    H::check(c.book(5, 15), false, "overlaps the start");
    H::check(c.book(12, 14), false, "inside");
