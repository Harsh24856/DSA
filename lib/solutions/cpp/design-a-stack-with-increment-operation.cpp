class CustomStack {
    int n;
    vector<int> st, inc;                               // inc[i]: amount still to add to st[0..i]
public:
    CustomStack(int maxSize) : n(maxSize) {}

    void push(int x) {
        if ((int)st.size() < n) { st.push_back(x); inc.push_back(0); }
    }

    int pop() {
        if (st.empty()) return -1;
        int add = inc.back(); inc.pop_back();
        if (!inc.empty()) inc.back() += add;           // pass the pending add down one place
        int x = st.back(); st.pop_back();
        return x + add;
    }

    void increment(int k, int val) {
        if (!st.empty()) inc[min(k, (int)st.size()) - 1] += val;   // lazy: mark only the top affected slot
    }
};
// @test
    CustomStack st(3);
    vector<int> got;
    st.push(1); st.push(2); got.push_back(st.pop());
    st.push(2); st.push(3); st.push(4);
    st.increment(5, 100); st.increment(2, 100);
    for (int i = 0; i < 4; i++) got.push_back(st.pop());
    H::check(got, vector<int>{2, 103, 202, 201, -1}, "CustomStack");
