class StockSpanner {
    vector<pair<int, int>> st;                 // (price, span), prices strictly falling
public:
    StockSpanner() {}

    int next(int price) {
        int span = 1;
        while (!st.empty() && st.back().first <= price) {   // absorb every smaller or equal day
            span += st.back().second;
            st.pop_back();
        }
        st.push_back({price, span});
        return span;
    }
};
// @test
    StockSpanner sp;
    vector<int> got;
    for (int p : {100, 80, 60, 70, 60, 75, 85}) got.push_back(sp.next(p));
    H::check(got, vector<int>{1, 1, 1, 2, 1, 4, 6}, "StockSpanner");
