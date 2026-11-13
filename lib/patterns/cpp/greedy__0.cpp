// Most non-overlapping [start, end) intervals: sort by end, keep what fits
vector<pair<int, int>> maxActivities(vector<pair<int, int>> iv) {
    sort(iv.begin(), iv.end(), [](auto& a, auto& b) { return a.second < b.second; });
    vector<pair<int, int>> kept;
    long long end = LLONG_MIN;
    for (auto& [s, e] : iv)
        if (s >= end) { kept.push_back({s, e}); end = e; }   // starts after the last kept one ends
    return kept;
}

// items = (value, weight); best value per weight first, split the last item
double fractionalKnapsack(vector<pair<int, int>> items, int cap) {
    sort(items.begin(), items.end(), [](auto& a, auto& b) { return (long long)a.first * b.second > (long long)b.first * a.second; });
    double total = 0;
    for (auto& [v, w] : items) {
        int take = min(w, cap);
        total += (double)v * take / w;
        cap -= take;
        if (cap == 0) break;
    }
    return total;
}

// largest coin first: right for 1, 2, 5, 10 ... but not for every coin set
int greedyCoins(vector<int> coins, int amount) {
    sort(coins.rbegin(), coins.rend());
    int count = 0;
    for (int c : coins) { count += amount / c; amount %= c; }
    return amount == 0 ? count : -1;
}

// the always-correct answer, to show where greedy fails
int dpCoins(const vector<int>& coins, int amount) {
    vector<int> best(amount + 1, INT_MAX);
    best[0] = 0;
    for (int a = 1; a <= amount; a++)
        for (int c : coins)
            if (c <= a && best[a - c] != INT_MAX) best[a] = min(best[a], best[a - c] + 1);
    return best[amount] == INT_MAX ? -1 : best[amount];
}

// fewest rooms for all meetings: sort by start, a min-heap of end times
int minRooms(vector<pair<int, int>> iv) {
    sort(iv.begin(), iv.end());
    priority_queue<int, vector<int>, greater<>> ends;
    for (auto& [s, e] : iv) {
        if (!ends.empty() && ends.top() <= s) ends.pop();   // reuse the room that frees first
        ends.push(e);
    }
    return ends.size();
}

// merging costs the sum of the two parts: always merge the two smallest
long long huffmanCost(const vector<long long>& freq) {
    priority_queue<long long, vector<long long>, greater<>> pq(freq.begin(), freq.end());
    long long cost = 0;
    while (pq.size() > 1) {
        long long a = pq.top(); pq.pop();
        long long b = pq.top(); pq.pop();
        cost += a + b;
        pq.push(a + b);
    }
    return cost;
}

// fewest jumps to the last index: BFS by levels of reach (Jump Game II)
int minJumps(const vector<int>& nums) {
    int jumps = 0, end = 0, far = 0;
    for (int i = 0; i + 1 < (int)nums.size(); i++) {
        far = max(far, i + nums[i]);
        if (i == end) { jumps++; end = far; }               // this level is used up
    }
    return jumps;
}
// @test
    H::check(maxActivities({{1, 4}, {3, 5}, {0, 6}, {5, 7}, {3, 9}, {5, 9}, {6, 10}, {8, 11}, {8, 12}, {2, 14}, {12, 16}}), vector<pair<int, int>>{{1, 4}, {5, 7}, {8, 11}, {12, 16}}, "activity selection");
    H::checkNear(fractionalKnapsack({{60, 10}, {100, 20}, {120, 30}}, 50), 240.0, "fractional knapsack");
    H::check(greedyCoins({1, 5, 10, 25}, 63), 6, "greedy coins, canonical set");
    H::check(dpCoins({1, 5, 10, 25}, 63), 6, "dp coins, canonical set");
    H::check(greedyCoins({1, 3, 4}, 6), 3, "greedy coins picks 4 + 1 + 1");
    H::check(dpCoins({1, 3, 4}, 6), 2, "dp coins finds 3 + 3");
    H::check(greedyCoins({2}, 3), -1, "greedy coins impossible");
    H::check(minRooms({{0, 30}, {5, 10}, {15, 20}}), 2, "two rooms");
    H::check(minRooms({{7, 10}, {2, 4}}), 1, "one room");
    H::check(huffmanCost({4, 3, 2, 6}), 29LL, "merge cost");
    H::check(minJumps({2, 3, 1, 1, 4}), 2, "jump game ii");
    H::check(minJumps({0}), 0, "already at the end");
