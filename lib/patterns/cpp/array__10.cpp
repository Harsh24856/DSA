// cyclic sort: value v belongs at index v - 1; swap values home, then the first wrong slot is the gap
int firstMissingPositive(vector<int> a) {
    int n = a.size();
    for (int i = 0; i < n; i++)
        while (a[i] >= 1 && a[i] <= n && a[a[i] - 1] != a[i])   // skip out-of-range values and duplicates
            swap(a[i], a[a[i] - 1]);                             // safe in C++: both references are bound first
    for (int i = 0; i < n; i++)
        if (a[i] != i + 1) return i + 1;
    return n + 1;
}
// @test
    H::check(firstMissingPositive({1, 2, 0}), 3, "1 2 0");
    H::check(firstMissingPositive({3, 4, -1, 1}), 2, "3 4 -1 1");
    H::check(firstMissingPositive({7, 8, 9, 11, 12}), 1, "all too big");
    H::check(firstMissingPositive({1, 1}), 2, "duplicates");
    H::check(firstMissingPositive({2, 1}), 3, "complete");
    H::check(firstMissingPositive({}), 1, "empty");
