// monotonic stack of indices still waiting for an answer; a larger value answers everything it pops
vector<int> nextGreater(const vector<int>& a) {
    vector<int> ans(a.size(), -1), st;
    for (int i = 0; i < (int)a.size(); i++) {
        while (!st.empty() && a[st.back()] < a[i]) {
            ans[st.back()] = a[i];
            st.pop_back();
        }
        st.push_back(i);
    }
    return ans;                                  // indices left on the stack have no next greater
}
// @test
    H::check(nextGreater({2, 1, 2, 4, 3}), vector<int>{4, 2, 4, -1, -1}, "classic");
    H::check(nextGreater({1, 2, 3}), vector<int>{2, 3, -1}, "rising");
    H::check(nextGreater({3, 2, 1}), vector<int>{-1, -1, -1}, "falling");
    H::check(nextGreater({2, 2}), vector<int>{-1, -1}, "equal is not greater");
