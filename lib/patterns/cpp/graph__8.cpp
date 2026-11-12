// flood fill each unvisited land cell; one fill = one island
int numIslands(vector<vector<char>>& g) {
    int R = g.size(), C = g[0].size(), count = 0;
    function<void(int, int)> fill = [&](int r, int c) {
        if (r < 0 || r >= R || c < 0 || c >= C || g[r][c] != '1') return;   // bounds first
        g[r][c] = '0';                                                       // mark visited
        fill(r + 1, c); fill(r - 1, c); fill(r, c + 1); fill(r, c - 1);
    };
    for (int r = 0; r < R; r++)
        for (int c = 0; c < C; c++)
            if (g[r][c] == '1') { fill(r, c); count++; }
    return count;
}
// @test
    vector<vector<char>> g = {{'1', '1', '0', '0', '0'}, {'1', '1', '0', '1', '0'}, {'0', '0', '1', '0', '0'}, {'0', '0', '0', '1', '1'}};
    H::check(numIslands(g), 4, "islands");
    vector<vector<char>> w = {{'0', '0'}, {'0', '0'}};
    H::check(numIslands(w), 0, "all water");
    vector<vector<char>> l = {{'1', '1'}, {'1', '1'}};
    H::check(numIslands(l), 1, "all land");
