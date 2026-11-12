class Solution {
public:
    int shortestPath(vector<vector<int>>& grid, int k) {
        int R = grid.size(), C = grid[0].size();
        if (k >= R + C - 2) return R + C - 2;   // enough to walk straight through anything
        vector<vector<int>> best(R, vector<int>(C, -1));   // most eliminations left on arrival
        best[0][0] = k;
        queue<array<int, 3>> q;
        q.push({0, 0, k});
        const int dr[] = {1, -1, 0, 0}, dc[] = {0, 0, 1, -1};
        for (int steps = 0; !q.empty(); steps++) {
            for (int s = q.size(); s > 0; s--) {
                auto [r, c, left] = q.front();
                q.pop();
                if (r == R - 1 && c == C - 1) return steps;
                for (int d = 0; d < 4; d++) {
                    int nr = r + dr[d], nc = c + dc[d];
                    if (nr < 0 || nr >= R || nc < 0 || nc >= C) continue;
                    int nl = left - grid[nr][nc];
                    if (nl > best[nr][nc]) {   // only revisit with more eliminations left
                        best[nr][nc] = nl;
                        q.push({nr, nc, nl});
                    }
                }
            }
        }
        return -1;
    }
};
