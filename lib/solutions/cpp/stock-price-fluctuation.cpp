class StockPrice {
    unordered_map<int, int> price;                         // true price per timestamp
    int latest = 0;
    priority_queue<pair<int, int>> hi;                                          // (price, time), max on top
    priority_queue<pair<int, int>, vector<pair<int, int>>, greater<>> lo;       // min on top
public:
    StockPrice() {}

    void update(int timestamp, int price) {
        this->price[timestamp] = price;
        latest = max(latest, timestamp);
        hi.push({price, timestamp});
        lo.push({price, timestamp});
    }

    int current() { return price[latest]; }

    int maximum() {
        while (price[hi.top().second] != hi.top().first) hi.pop();   // drop stale entries
        return hi.top().first;
    }

    int minimum() {
        while (price[lo.top().second] != lo.top().first) lo.pop();
        return lo.top().first;
    }
};
// @test
    StockPrice s;
    vector<int> got;
    s.update(1, 10); s.update(2, 5);
    got.push_back(s.current()); got.push_back(s.maximum());
    s.update(1, 3);
    got.push_back(s.maximum());
    s.update(4, 2);
    got.push_back(s.minimum());
    H::check(got, vector<int>{5, 10, 5, 2}, "StockPrice");
