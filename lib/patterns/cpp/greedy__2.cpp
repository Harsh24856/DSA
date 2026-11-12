// minimum jumps: each window [.., end] is one jump; far is where the next window ends
int jump(const vector<int>& a) {
    int jumps = 0, end = 0, far = 0;
    for (int i = 0; i + 1 < (int)a.size(); i++) {     // stop before the last index
        far = max(far, i + a[i]);
        if (i == end) { jumps++; end = far; }        // finished one jump's window
    }
    return jumps;
}
// @test
    H::check(jump({2, 3, 1, 1, 4}), 2, "jump game ii");
    H::check(jump({2, 3, 0, 1, 4}), 2, "with a zero");
    H::check(jump({0}), 0, "already there");
    H::check(jump({1, 1, 1, 1}), 3, "one at a time");
