class Solution {
    int m, n, timer = 0;
    bool cut = false;
    vector<vector<int>> disc, low;

    void dfs(vector<vector<int>>& grid, int r, int c, int pr, int pc) {
        disc[r][c] = low[r][c] = timer++;
        int children = 0;
        int dr[] = {1, -1, 0, 0}, dc[] = {0, 0, 1, -1};
        for (int k = 0; k < 4; k++) {
            int nr = r + dr[k], nc = c + dc[k];
            if (nr < 0 || nr >= m || nc < 0 || nc >= n || !grid[nr][nc]) continue;
            if (disc[nr][nc] < 0) {
                children++;
                dfs(grid, nr, nc, r, c);
                low[r][c] = min(low[r][c], low[nr][nc]);
                if (pr >= 0 && low[nr][nc] >= disc[r][c]) cut = true;   // nothing below (nr, nc) climbs above (r, c)
            } else if (nr != pr || nc != pc) {
                low[r][c] = min(low[r][c], disc[nr][nc]);
            }
        }
        if (pr < 0 && children > 1) cut = true;
    }

public:
    int minDays(vector<vector<int>>& grid) {
        m = grid.size(); n = grid[0].size();
        disc.assign(m, vector<int>(n, -1)); low.assign(m, vector<int>(n, 0));
        int land = 0, sr = -1, sc = -1;
        for (int r = 0; r < m; r++)
            for (int c = 0; c < n; c++)
                if (grid[r][c]) { land++; if (sr < 0) { sr = r; sc = c; } }
        if (!land) return 0;
        dfs(grid, sr, sc, -1, -1);
        if (timer < land) return 0;
        if (land == 1 || cut) return 1;
        return 2;
    }
};
