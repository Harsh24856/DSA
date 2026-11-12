class Solution {
public:
    int minimumEffortPath(vector<vector<int>>& heights) {
        int R = heights.size(), C = heights[0].size();
        vector<vector<int>> best(R, vector<int>(C, INT_MAX));
        best[0][0] = 0;
        priority_queue<tuple<int, int, int>, vector<tuple<int, int, int>>, greater<>> heap;
        heap.push({0, 0, 0});
        int dr[] = {1, -1, 0, 0}, dc[] = {0, 0, 1, -1};
        while (!heap.empty()) {
            auto [e, r, c] = heap.top(); heap.pop();
            if (r == R - 1 && c == C - 1) return e;
            if (e > best[r][c]) continue;
            for (int d = 0; d < 4; d++) {
                int nr = r + dr[d], nc = c + dc[d];
                if (nr < 0 || nr >= R || nc < 0 || nc >= C) continue;
                int ne = max(e, abs(heights[nr][nc] - heights[r][c]));   // effort is the largest single step
                if (ne < best[nr][nc]) { best[nr][nc] = ne; heap.push({ne, nr, nc}); }
            }
        }
        return 0;
    }
};
