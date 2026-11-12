class MinStack {
    vector<pair<int, int>> st;                // (value, smallest value at or below it)
public:
    MinStack() {}

    void push(int val) {
        int low = st.empty() ? val : min(val, st.back().second);
        st.push_back({val, low});
    }

    void pop() { st.pop_back(); }

    int top() { return st.back().first; }

    int getMin() { return st.back().second; }
};
// @test
    MinStack ms;
    ms.push(-2); ms.push(0); ms.push(-3);
    H::check(ms.getMin(), -3, "getMin");
    ms.pop();
    H::check(ms.top(), 0, "top");
    H::check(ms.getMin(), -2, "getMin after pop");
