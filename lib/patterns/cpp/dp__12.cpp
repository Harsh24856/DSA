const int MOD = 1'000'000'007;

// Pascal's rule: choose item i or not
vector<vector<int>> pascal(int n) {
    vector<vector<int>> C(n + 1, vector<int>(n + 1, 0));
    for (int i = 0; i <= n; i++) {
        C[i][0] = 1;
        for (int j = 1; j <= i; j++) C[i][j] = (C[i - 1][j - 1] + C[i - 1][j]) % MOD;   // two values < MOD fit in int
    }
    return C;
}

// paths with right/down moves; a blocked cell (1) has 0 paths
int pathsWithObstacles(const vector<vector<int>>& grid) {
    int C = grid[0].size();
    vector<int> row(C, 0);
    row[0] = 1;
    for (auto& r : grid)
        for (int c = 0; c < C; c++) {
            if (r[c]) row[c] = 0;
            else if (c) row[c] = (row[c] + row[c - 1]) % MOD;
        }
    return row[C - 1];
}
// @test
    auto C = pascal(30);
    H::check(C[6], vector<int>{1, 6, 15, 20, 15, 6, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0}, "row 6");
    H::check(C[30][15], 155117520, "C(30, 15)");
    H::check(pascal(1000)[1000][500], 159835829, "C(1000, 500) mod p");
    H::check(pathsWithObstacles({{0, 0, 0}, {0, 1, 0}, {0, 0, 0}}), 2, "one obstacle");
    H::check(pathsWithObstacles({{1}}), 0, "blocked start");
    H::check(pathsWithObstacles({{0, 1}, {0, 0}}), 1, "around the wall");
