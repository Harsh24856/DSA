class SmallestInfiniteSet {
    int next = 1;                                          // every number >= next is still in the set
    priority_queue<int, vector<int>, greater<int>> heap;   // numbers added back below next
    unordered_set<int> back;
public:
    SmallestInfiniteSet() {}

    int popSmallest() {
        if (!heap.empty()) {
            int x = heap.top(); heap.pop();
            back.erase(x);
            return x;
        }
        return next++;
    }

    void addBack(int num) {
        if (num < next && !back.count(num)) { back.insert(num); heap.push(num); }
    }
};
// @test
    SmallestInfiniteSet s;
    s.addBack(2);
    vector<int> got;
    for (int i = 0; i < 3; i++) got.push_back(s.popSmallest());
    s.addBack(1);
    for (int i = 0; i < 3; i++) got.push_back(s.popSmallest());
    H::check(got, vector<int>{1, 2, 3, 1, 4, 5}, "SmallestInfiniteSet");
