// Recursion and backtracking from scratch: base case, divide and conquer, choose / explore / un-choose, pruning.
long long factorial(int n) {
    if (n <= 1) return 1;                    // base case
    return n * factorial(n - 1);             // recursive case: one frame per level
}

long long factorialTail(int n, long long acc = 1) {
    if (n <= 1) return acc;                  // tail call: nothing left to do after it,
    return factorialTail(n - 1, acc * n);    // so -O2 usually turns it into a loop (not guaranteed)
}

long long power(long long x, int n) {        // T(n) = T(n / 2) + O(1): O(log n) time and depth
    if (n == 0) return 1;
    long long half = power(x, n / 2);
    return half * half * (n % 2 ? x : 1);
}

void mergeSort(vector<int>& a, int lo, int hi, vector<int>& buf) {   // sorts a[lo, hi)
    if (hi - lo <= 1) return;
    int mid = lo + (hi - lo) / 2;
    mergeSort(a, lo, mid, buf);
    mergeSort(a, mid, hi, buf);
    int i = lo, j = mid, k = lo;
    while (i < mid && j < hi) buf[k++] = a[i] <= a[j] ? a[i++] : a[j++];
    while (i < mid) buf[k++] = a[i++];
    while (j < hi) buf[k++] = a[j++];
    copy(buf.begin() + lo, buf.begin() + hi, a.begin() + lo);
}
vector<int> mergeSorted(vector<int> a) { vector<int> buf(a.size()); mergeSort(a, 0, (int)a.size(), buf); return a; }

void subsetsGo(const vector<int>& nums, size_t i, vector<int>& path, vector<vector<int>>& out) {
    if (i == nums.size()) { out.push_back(path); return; }
    subsetsGo(nums, i + 1, path, out);       // skip nums[i]
    path.push_back(nums[i]);                 // choose
    subsetsGo(nums, i + 1, path, out);       // explore
    path.pop_back();                         // un-choose
}
vector<vector<int>> subsets(const vector<int>& nums) {
    vector<vector<int>> out; vector<int> path;
    subsetsGo(nums, 0, path, out);
    return out;
}

vector<vector<int>> permutations(const vector<int>& nums) {
    vector<vector<int>> out; vector<int> path; vector<bool> used(nums.size(), false);
    function<void()> go = [&]() {
        if (path.size() == nums.size()) { out.push_back(path); return; }
        for (size_t i = 0; i < nums.size(); i++) {
            if (used[i]) continue;
            used[i] = true; path.push_back(nums[i]);
            go();
            path.pop_back(); used[i] = false;
        }
    };
    go();
    return out;
}

vector<vector<int>> combinationSum(vector<int> cands, int target) {
    sort(cands.begin(), cands.end());
    vector<vector<int>> out; vector<int> path;
    function<void(size_t, int)> go = [&](size_t start, int left) {
        if (left == 0) { out.push_back(path); return; }
        for (size_t k = start; k < cands.size(); k++) {
            if (cands[k] > left) break;      // prune: sorted, so every later one is too big
            path.push_back(cands[k]);
            go(k, left - cands[k]);          // k again: reuse allowed
            path.pop_back();
        }
    };
    go(0, target);
    return out;
}

int nQueens(int n) {
    vector<bool> col(n), d1(2 * n), d2(2 * n);
    function<int(int)> go = [&](int r) -> int {
        if (r == n) return 1;
        int count = 0;
        for (int c = 0; c < n; c++) {
            if (col[c] || d1[r - c + n] || d2[r + c]) continue;    // prune attacked squares
            col[c] = d1[r - c + n] = d2[r + c] = true;
            count += go(r + 1);
            col[c] = d1[r - c + n] = d2[r + c] = false;
        }
        return count;
    };
    return go(0);
}

vector<vector<int>> subsetsIterative(const vector<int>& nums) {   // explicit stack: no depth limit
    vector<vector<int>> out;
    vector<pair<size_t, vector<int>>> st{{0, {}}};
    while (!st.empty()) {
        auto [i, path] = st.back(); st.pop_back();
        if (i == nums.size()) { out.push_back(path); continue; }
        auto with = path; with.push_back(nums[i]);
        st.push_back({i + 1, with});
        st.push_back({i + 1, path});
    }
    return out;
}
// @test
    H::check(factorial(5), 120LL, "factorial");
    H::check(factorial(0), 1LL, "factorial 0");
    H::check(factorialTail(10), 3628800LL, "tail factorial");
    H::check(power(2, 10), 1024LL, "power");
    H::check(power(3, 0), 1LL, "power 0");
    H::check(mergeSorted({5, 2, 4, 7, 1, 3, 2, 6}), vector<int>{1, 2, 2, 3, 4, 5, 6, 7}, "merge sort");
    H::check(mergeSorted({}), vector<int>{}, "merge sort empty");
    H::check(subsets({1, 2, 3}), vector<vector<int>>{{}, {3}, {2}, {2, 3}, {1}, {1, 3}, {1, 2}, {1, 2, 3}}, "subsets");
    H::check(subsetsIterative({1, 2, 3}), subsets({1, 2, 3}), "subsets iterative");
    H::check(permutations({1, 2, 3}), vector<vector<int>>{{1, 2, 3}, {1, 3, 2}, {2, 1, 3}, {2, 3, 1}, {3, 1, 2}, {3, 2, 1}}, "permutations");
    H::check(combinationSum({2, 3, 6, 7}, 7), vector<vector<int>>{{2, 2, 3}, {7}}, "combination sum");
    H::check(combinationSum({2}, 1), vector<vector<int>>{}, "combination sum none");
    H::check(nQueens(4), 2, "4 queens");
    H::check(nQueens(8), 92, "8 queens");
    H::check(nQueens(1), 1, "1 queen");
