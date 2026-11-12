// sliding window median with lazy deletion: a value that leaves the window is only marked dead,
// and is popped later when it reaches the top of its heap
vector<double> medianSlidingWindow(const vector<int>& a, int k) {
    priority_queue<int> lo;                                   // smaller half, max on top
    priority_queue<int, vector<int>, greater<int>> hi;        // larger half, min on top
    unordered_map<int, int> dead;                             // value -> stale copies still inside a heap
    auto prune = [&](auto& h) {                               // pop dead values sitting on top
        while (!h.empty()) {
            auto it = dead.find(h.top());
            if (it == dead.end() || it->second == 0) break;
            it->second--;
            h.pop();
        }
    };
    for (int i = 0; i < k; i++) lo.push(a[i]);
    for (int i = 0; i < k / 2; i++) { hi.push(lo.top()); lo.pop(); }
    auto median = [&] { return k % 2 ? (double)lo.top() : ((double)lo.top() + hi.top()) / 2; };
    vector<double> out{median()};
    for (int i = k; i < (int)a.size(); i++) {
        int x = a[i], y = a[i - k], bal = 0;                  // bal = change in (valid in lo) - (valid in hi)
        if (x <= lo.top()) { lo.push(x); bal++; } else { hi.push(x); bal--; }
        dead[y]++;
        if (y <= lo.top()) bal--; else bal++;                 // which half y counted in
        if (bal > 0) { hi.push(lo.top()); lo.pop(); }
        if (bal < 0) { lo.push(hi.top()); hi.pop(); }
        prune(lo);                                            // only the tops must be valid
        prune(hi);
        out.push_back(median());
    }
    return out;
}
// @test
    H::check(medianSlidingWindow({1, 3, -1, -3, 5, 3, 6, 7}, 3), vector<double>{1, -1, -1, 3, 5, 6}, "odd k");
    H::check(medianSlidingWindow({1, 2, 3, 4, 2, 3, 1, 4, 2}, 3), vector<double>{2, 3, 3, 3, 2, 3, 2}, "duplicates");
    H::check(medianSlidingWindow({1, 2, 3, 4}, 2), vector<double>{1.5, 2.5, 3.5}, "even k");
    H::check(medianSlidingWindow({1, 3, 2}, 1), vector<double>{1, 3, 2}, "k = 1");
    H::check(medianSlidingWindow({INT_MAX, INT_MAX}, 2), vector<double>{(double)INT_MAX}, "no overflow");
    unsigned seed = 7;                                        // brute force on many small windows with repeats
    int bad = 0;
    for (int round = 0; round < 300; round++) {
        vector<int> v(1 + round % 12);
        for (int& x : v) { seed = seed * 1103515245 + 12345; x = (seed >> 16) % 5; }
        int k = 1 + (seed >> 8) % v.size();
        vector<double> want;
        for (int i = 0; i + k <= (int)v.size(); i++) {
            vector<int> w(v.begin() + i, v.begin() + i + k);
            sort(w.begin(), w.end());
            want.push_back(k % 2 ? w[k / 2] : (w[k / 2 - 1] + (double)w[k / 2]) / 2);
        }
        if (medianSlidingWindow(v, k) != want) bad++;
    }
    H::check(bad, 0, "matches brute force on 300 random windows");
