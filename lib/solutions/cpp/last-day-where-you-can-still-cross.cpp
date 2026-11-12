class Solution {
    vector<int> parent;
    int find(int x) {
        while (parent[x] != x) {
            parent[x] = parent[parent[x]];
            x = parent[x];
        }
        return x;
    }
public:
    int latestDayToCross(int row, int col, vector<vector<int>>& cells) {
        int n = row * col, TOP = n, BOT = n + 1;   // two virtual nodes for the top and bottom rows
        parent.resize(n + 2);
        iota(parent.begin(), parent.end(), 0);
        vector<vector<bool>> land(row, vector<bool>(col, false));
        const int dr[] = {1, -1, 0, 0}, dc[] = {0, 0, 1, -1};
        for (int d = cells.size() - 1; d >= 0; d--) {   // add land back, last day first
            int r = cells[d][0] - 1, c = cells[d][1] - 1;
            land[r][c] = true;
            int u = r * col + c;
            if (r == 0) parent[find(u)] = find(TOP);
            if (r == row - 1) parent[find(u)] = find(BOT);
            for (int k = 0; k < 4; k++) {
                int nr = r + dr[k], nc = c + dc[k];
                if (nr >= 0 && nr < row && nc >= 0 && nc < col && land[nr][nc]) parent[find(u)] = find(nr * col + nc);
            }
            if (find(TOP) == find(BOT)) return d;
        }
        return 0;
    }
};
