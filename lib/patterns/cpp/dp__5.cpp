// one row: row[c] holds "above" until it is updated, then becomes the current cell
long long uniquePaths(int R, int C) {
    vector<long long> row(C, 1);
    for (int r = 1; r < R; r++)
        for (int c = 1; c < C; c++) row[c] += row[c - 1];   // above + left
    return row[C - 1];
}
// @test
    H::check(uniquePaths(3, 7), 28LL, "3 x 7");
    H::check(uniquePaths(3, 2), 3LL, "3 x 2");
    H::check(uniquePaths(1, 1), 1LL, "single cell");
    H::check(uniquePaths(10, 10), 48620LL, "C(18, 9)");
