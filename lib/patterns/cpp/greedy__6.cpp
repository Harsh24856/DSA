// move the lower side: its water level is already fixed by its own side's maximum
int trap(const vector<int>& h) {
    int L = 0, R = (int)h.size() - 1, lm = 0, rm = 0, water = 0;
    while (L < R) {
        if (h[L] < h[R]) { lm = max(lm, h[L]); water += lm - h[L]; L++; }
        else { rm = max(rm, h[R]); water += rm - h[R]; R--; }
    }
    return water;
}
// @test
    H::check(trap({0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1}), 6, "trap");
    H::check(trap({4, 2, 0, 3, 2, 5}), 9, "trap 2");
    H::check(trap({}), 0, "empty");
    H::check(trap({3, 2, 1}), 0, "falling");
