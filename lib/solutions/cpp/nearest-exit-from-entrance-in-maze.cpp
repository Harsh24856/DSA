class Solution {
public:
    int nearestExit(vector<vector<char>>& maze, vector<int>& entrance) {
        int R = maze.size(), C = maze[0].size();
        int dr[] = {1, -1, 0, 0}, dc[] = {0, 0, 1, -1};
        queue<tuple<int, int, int>> q;                 // (row, col, steps)
        q.push({entrance[0], entrance[1], 0});
        maze[entrance[0]][entrance[1]] = '+';          // mark visited by walling it off
        while (!q.empty()) {
            auto [r, c, d] = q.front(); q.pop();
            for (int k = 0; k < 4; k++) {
                int nr = r + dr[k], nc = c + dc[k];
                if (nr >= 0 && nr < R && nc >= 0 && nc < C && maze[nr][nc] == '.') {
                    if (nr == 0 || nr == R - 1 || nc == 0 || nc == C - 1) return d + 1;   // first border cell
                    maze[nr][nc] = '+';
                    q.push({nr, nc, d + 1});
                }
            }
        }
        return -1;
    }
};
