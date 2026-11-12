// monotonic deque of indices: values fall from front to back, so the front is the window maximum
vector<int> maxSlidingWindow(const vector<int>& a, int k) {
    deque<int> dq;
    vector<int> out;
    for (int i = 0; i < (int)a.size(); i++) {
        if (!dq.empty() && dq.front() <= i - k) dq.pop_front();     // the front slid out of the window
        while (!dq.empty() && a[dq.back()] <= a[i]) dq.pop_back();  // beaten by a newer, larger value
        dq.push_back(i);
        if (i >= k - 1) out.push_back(a[dq.front()]);
    }
    return out;
}
// @test
    H::check(maxSlidingWindow({1, 3, -1, -3, 5, 3, 6, 7}, 3), vector<int>{3, 3, 5, 5, 6, 7}, "classic");
    H::check(maxSlidingWindow({1}, 1), vector<int>{1}, "one");
    H::check(maxSlidingWindow({9, 8, 7, 6}, 2), vector<int>{9, 8, 7}, "falling");
    H::check(maxSlidingWindow({4, 4, 4}, 2), vector<int>{4, 4}, "equal values");
