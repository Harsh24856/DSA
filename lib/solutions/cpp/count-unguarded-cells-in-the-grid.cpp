class Solution {
public:
    int countUnguarded(int m, int n, vector<vector<int>>& guards, vector<vector<int>>& walls) {
        vector<vector<int>> g(m, vector<int>(n, 0));   // 0 free, 1 guarded, 2 guard or wall
        for (auto& p : guards) g[p[0]][p[1]] = 2;
        for (auto& p : walls) g[p[0]][p[1]] = 2;
        const int dr[] = {1, -1, 0, 0}, dc[] = {0, 0, 1, -1};
        for (auto& p : guards)
            for (int d = 0; d < 4; d++)   // look along each direction until blocked
                for (int y = p[0] + dr[d], x = p[1] + dc[d]; y >= 0 && y < m && x >= 0 && x < n && g[y][x] != 2; y += dr[d], x += dc[d])
                    g[y][x] = 1;
        int free = 0;
        for (auto& row : g) free += count(row.begin(), row.end(), 0);
        return free;
    }
};
