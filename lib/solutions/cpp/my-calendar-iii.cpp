class MyCalendarThree {
    map<int, int> delta;   // +1 where a booking starts, -1 where it ends
public:
    MyCalendarThree() {}

    int book(int startTime, int endTime) {
        delta[startTime]++;
        delta[endTime]--;
        int best = 0, cur = 0;
        for (auto& [t, d] : delta) {   // sweep in time order
            cur += d;
            best = max(best, cur);
        }
        return best;
    }
};
// @test
    MyCalendarThree c;
    vector<pair<int, int>> books{{10, 20}, {50, 60}, {10, 40}, {5, 15}, {5, 10}, {25, 55}};
    vector<int> got;
    for (auto [s, e] : books) got.push_back(c.book(s, e));
    H::check(got, vector<int>{1, 1, 2, 3, 3, 3}, "MyCalendarThree");
