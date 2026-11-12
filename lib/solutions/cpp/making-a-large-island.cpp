class Solution {
public:
    int largestIsland(vector<vector<int>>& grid) {
        int n = grid.size(), label = 2;
        unordered_map<int, int> size;            // island label -> its area
        const int dy[] = {1, -1, 0, 0}, dx[] = {0, 0, 1, -1};
        for (int r = 0; r < n; r++)
            for (int c = 0; c < n; c++) {
                if (grid[r][c] != 1) continue;
                grid[r][c] = label;               // flood fill with a new label
                vector<pair<int, int>> stack{{r, c}};
                int cnt = 0;
                while (!stack.empty()) {
                    auto [y, x] = stack.back();
                    stack.pop_back();
                    cnt++;
                    for (int d = 0; d < 4; d++) {
                        int ny = y + dy[d], nx = x + dx[d];
                        if (ny >= 0 && ny < n && nx >= 0 && nx < n && grid[ny][nx] == 1) {
                            grid[ny][nx] = label;
                            stack.push_back({ny, nx});
                        }
                    }
                }
                size[label++] = cnt;
            }
        int best = 0;
        for (auto& [l, s] : size) best = max(best, s);
        for (int r = 0; r < n; r++)
            for (int c = 0; c < n; c++) {
                if (grid[r][c] != 0) continue;
                set<int> ids;                     // distinct islands touching this water cell
                for (int d = 0; d < 4; d++) {
                    int y = r + dy[d], x = c + dx[d];
                    if (y >= 0 && y < n && x >= 0 && x < n && grid[y][x] > 1) ids.insert(grid[y][x]);
                }
                int total = 1;
                for (int i : ids) total += size[i];
                best = max(best, total);
            }
        return best;
    }
};
