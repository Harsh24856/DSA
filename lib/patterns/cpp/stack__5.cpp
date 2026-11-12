// each entry remembers the minimum of everything at or below it, so getMin is the top's copy
class MinStack {
    vector<pair<int, int>> st;                   // (value, min so far)
public:
    void push(int x) { st.push_back({x, st.empty() ? x : min(x, st.back().second)}); }
    void pop() { st.pop_back(); }
    int top() const { return st.back().first; }
    int getMin() const { return st.back().second; }
};
// @test
    MinStack s;
    s.push(-2); s.push(0); s.push(-3);
    H::check(s.getMin(), -3, "min -3");
    s.pop();
    H::check(s.top(), 0, "top 0");
    H::check(s.getMin(), -2, "min restored after pop");
    s.push(-2);
    s.pop();
    H::check(s.getMin(), -2, "duplicate min");
