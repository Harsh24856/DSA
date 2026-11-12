// first step at which the walk revisits a point, or -1
int solve(string s) {
    map<char, pair<int, int>> moves{{'U', {0, 1}}, {'D', {0, -1}}, {'L', {-1, 0}}, {'R', {1, 0}}};
    int x = 0, y = 0;
    set<pair<int, int>> seen{{0, 0}};
    for (int step = 1; step <= (int)s.size(); step++) {
        x += moves[s[step - 1]].first;
        y += moves[s[step - 1]].second;
        if (!seen.insert({x, y}).second) return step;      // already visited
    }
    return -1;
}
