// A grid toolkit: the small pieces most "simulate this process" problems are built from.
using Grid = vector<vector<int>>;
constexpr int DR[8] = {-1, 0, 1, 0, -1, -1, 1, 1};     // first 4: up, right, down, left (clockwise)
constexpr int DC[8] = {0, 1, 0, -1, -1, 1, 1, -1};     // last 4: the diagonals

Grid makeGrid(int R, int C, int fill = 0) { return Grid(R, vector<int>(C, fill)); }

bool inBounds(int r, int c, int R, int C) { return r >= 0 && r < R && c >= 0 && c < C; }

vector<pair<int, int>> neighbours(int r, int c, int R, int C, int k = 4) {   // k = 4 or 8
    vector<pair<int, int>> out;
    for (int d = 0; d < k; d++)
        if (inBounds(r + DR[d], c + DC[d], R, C)) out.push_back({r + DR[d], c + DC[d]});
    return out;
}

int toIndex(int r, int c, int C) { return r * C + c; }                       // row-major
pair<int, int> fromIndex(int i, int C) { return {i / C, i % C}; }

vector<int> spiralOrder(const Grid& g) {                // peel the outer ring, then shrink the bounds
    vector<int> out;
    int top = 0, bottom = (int)g.size() - 1, left = 0, right = (int)g[0].size() - 1;
    while (top <= bottom && left <= right) {
        for (int c = left; c <= right; c++) out.push_back(g[top][c]);
        top++;
        for (int r = top; r <= bottom; r++) out.push_back(g[r][right]);
        right--;
        if (top <= bottom) { for (int c = right; c >= left; c--) out.push_back(g[bottom][c]); bottom--; }
        if (left <= right) { for (int r = bottom; r >= top; r--) out.push_back(g[r][left]); left++; }
    }
    return out;
}

void rotateClockwise(Grid& g) {                         // square grid: transpose, then mirror each row
    int n = g.size();
    for (int i = 0; i < n; i++)
        for (int j = i + 1; j < n; j++) swap(g[i][j], g[j][i]);
    for (auto& row : g) reverse(row.begin(), row.end());
}

// 'L' / 'R' turn by moving the direction index, 'G' steps once; returns {row, col, facing}
vector<int> walk(const string& commands, int r = 0, int c = 0, int d = 0) {
    for (char cmd : commands) {
        if (cmd == 'L') d = (d + 3) % 4;
        else if (cmd == 'R') d = (d + 1) % 4;
        else r += DR[d], c += DC[d];
    }
    return {r, c, d};
}

// one round of a simulation: every new cell is computed from the OLD grid only
Grid step(const Grid& g, const function<int(int, int)>& rule) {
    int R = g.size(), C = g[0].size();
    Grid next = makeGrid(R, C);
    for (int r = 0; r < R; r++)
        for (int c = 0; c < C; c++) {
            int live = 0;
            for (auto [nr, nc] : neighbours(r, c, R, C, 8)) live += g[nr][nc];
            next[r][c] = rule(g[r][c], live);
        }
    return next;
}
// @test
    Grid g = makeGrid(2, 3); g[0][0] = 5;
    H::check(g[1][0], 0, "rows are separate");
    H::check(inBounds(1, 2, 2, 3), true, "in bounds");
    H::check(inBounds(2, 0, 2, 3) || inBounds(0, -1, 2, 3), false, "out of bounds");
    H::check(H::sorted(neighbours(0, 0, 3, 3)), vector<pair<int, int>>{{0, 1}, {1, 0}}, "corner has 2 neighbours");
    H::check(neighbours(1, 1, 3, 3, 8).size(), (size_t)8, "centre has 8");
    H::check(toIndex(2, 1, 4), 9, "to index");
    H::check(fromIndex(9, 4), pair<int, int>{2, 1}, "from index");
    H::check(spiralOrder({{1, 2, 3}, {4, 5, 6}, {7, 8, 9}}), vector<int>{1, 2, 3, 6, 9, 8, 7, 4, 5}, "spiral 3x3");
    H::check(spiralOrder({{1, 2, 3, 4}, {5, 6, 7, 8}, {9, 10, 11, 12}}), vector<int>{1, 2, 3, 4, 8, 12, 11, 10, 9, 5, 6, 7}, "spiral 3x4");
    H::check(spiralOrder({{1}, {2}, {3}}), vector<int>{1, 2, 3}, "spiral column");
    Grid sq{{1, 2, 3}, {4, 5, 6}, {7, 8, 9}}; rotateClockwise(sq);
    H::check(sq, Grid{{7, 4, 1}, {8, 5, 2}, {9, 6, 3}}, "rotate");
    H::check(walk("GGLLGG"), vector<int>{0, 0, 2}, "walk back home");
    H::check(walk("GRG"), vector<int>{-1, 1, 1}, "walk and turn");
    H::check(walk("LLLL"), vector<int>{0, 0, 0}, "four turns");
    auto life = [](int alive, int n) { return n == 3 || (alive && n == 2) ? 1 : 0; };
    H::check(step({{0, 1, 0}, {0, 1, 0}, {0, 1, 0}}, life), Grid{{0, 0, 0}, {1, 1, 1}, {0, 0, 0}}, "life blinker");
