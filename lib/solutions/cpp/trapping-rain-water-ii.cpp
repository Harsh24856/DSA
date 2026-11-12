class Solution {
public:
    int trapRainWater(vector<vector<int>>& heightMap) {
        int m = heightMap.size(), n = heightMap[0].size();
        vector<vector<bool>> seen(m, vector<bool>(n, false));
        priority_queue<tuple<int, int, int>, vector<tuple<int, int, int>>, greater<>> pq;   // (wall, r, c)
        for (int r = 0; r < m; r++)
            for (int c = 0; c < n; c++)
                if (r == 0 || r == m - 1 || c == 0 || c == n - 1) { pq.push({heightMap[r][c], r, c}); seen[r][c] = true; }
        int water = 0;
        int dr[] = {1, -1, 0, 0}, dc[] = {0, 0, 1, -1};
        while (!pq.empty()) {
            auto [h, r, c] = pq.top(); pq.pop();
            for (int d = 0; d < 4; d++) {
                int nr = r + dr[d], nc = c + dc[d];
                if (nr < 0 || nr >= m || nc < 0 || nc >= n || seen[nr][nc]) continue;
                seen[nr][nc] = true;
                water += max(0, h - heightMap[nr][nc]);    // the lowest wall decides the fill
                pq.push({max(h, heightMap[nr][nc]), nr, nc});
            }
        }
        return water;
    }
};
