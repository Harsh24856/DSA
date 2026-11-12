class Solution {
public:
    int minFlips(vector<vector<int>>& mat) {
        int m = mat.size(), n = mat[0].size();
        int start = 0;
        for (int r = 0; r < m; r++)
            for (int c = 0; c < n; c++) start |= mat[r][c] << (r * n + c);   // the grid as a bitmask
        vector<int> flips;                                                      // mask each cell toggles
        const int dy[] = {0, 1, -1, 0, 0}, dx[] = {0, 0, 0, 1, -1};
        for (int r = 0; r < m; r++)
            for (int c = 0; c < n; c++) {
                int f = 0;
                for (int d = 0; d < 5; d++) {
                    int y = r + dy[d], x = c + dx[d];
                    if (y >= 0 && y < m && x >= 0 && x < n) f |= 1 << (y * n + x);
                }
                flips.push_back(f);
            }
        unordered_map<int, int> dist{{start, 0}};
        queue<int> q;
        q.push(start);
        while (!q.empty()) {                    // BFS over grid states
            int s = q.front();
            q.pop();
            if (s == 0) return dist[s];
            for (int f : flips) {
                int t = s ^ f;
                if (!dist.count(t)) {
                    dist[t] = dist[s] + 1;
                    q.push(t);
                }
            }
        }
        return -1;
    }
};
