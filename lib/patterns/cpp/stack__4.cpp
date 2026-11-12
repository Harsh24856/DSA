// increasing stack of bar indices: when a shorter bar arrives, the popped bar's widest rectangle is known
int largestRect(vector<int> h) {
    h.push_back(0);                              // sentinel: forces every bar off the stack at the end
    vector<int> st;
    int best = 0;
    for (int i = 0; i < (int)h.size(); i++) {
        while (!st.empty() && h[st.back()] > h[i]) {
            int top = st.back(); st.pop_back();
            int left = st.empty() ? 0 : st.back() + 1;   // the new top is the first shorter bar on the left
            best = max(best, h[top] * (i - left));
        }
        st.push_back(i);
    }
    return best;
}
// @test
    H::check(largestRect({2, 1, 5, 6, 2, 3}), 10, "classic");
    H::check(largestRect({2, 4}), 4, "two bars");
    H::check(largestRect({3, 3, 3}), 9, "flat");
    H::check(largestRect({}), 0, "empty");
