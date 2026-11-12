class Solution {
public:
    vector<vector<int>> pacificAtlantic(vector<vector<int>>& heights) {
        int R = heights.size(), C = heights[0].size();
        // every cell reachable by walking uphill from the given ocean edge
        auto climb = [&](vector<pair<int, int>> stack) {
            vector<vector<bool>> seen(R, vector<bool>(C, false));
            for (auto [r, c] : stack) seen[r][c] = true;
            int dr[] = {1, -1, 0, 0}, dc[] = {0, 0, 1, -1};
            while (!stack.empty()) {
                auto [r, c] = stack.back(); stack.pop_back();
                for (int d = 0; d < 4; d++) {
                    int nr = r + dr[d], nc = c + dc[d];
                    if (nr >= 0 && nr < R && nc >= 0 && nc < C && !seen[nr][nc] && heights[nr][nc] >= heights[r][c]) {
                        seen[nr][nc] = true;
                        stack.push_back({nr, nc});
                    }
                }
            }
            return seen;
        };
        vector<pair<int, int>> pacStart, atlStart;
        for (int r = 0; r < R; r++) { pacStart.push_back({r, 0}); atlStart.push_back({r, C - 1}); }
        for (int c = 0; c < C; c++) { pacStart.push_back({0, c}); atlStart.push_back({R - 1, c}); }
        auto pac = climb(pacStart), atl = climb(atlStart);
        vector<vector<int>> out;
        for (int r = 0; r < R; r++)
            for (int c = 0; c < C; c++)
                if (pac[r][c] && atl[r][c]) out.push_back({r, c});
        return out;
    }
};
