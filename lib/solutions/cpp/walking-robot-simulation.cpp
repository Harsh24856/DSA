class Solution {
public:
    int robotSim(vector<int>& commands, vector<vector<int>>& obstacles) {
        set<pair<int, int>> blocked;
        for (auto& o : obstacles) blocked.insert({o[0], o[1]});
        const int dx[4] = {0, 1, 0, -1}, dy[4] = {1, 0, -1, 0};
        int x = 0, y = 0, d = 0, best = 0;
        for (int cmd : commands) {
            if (cmd == -2) d = (d + 3) % 4;
            else if (cmd == -1) d = (d + 1) % 4;
            else {
                for (int s = 0; s < cmd && !blocked.count({x + dx[d], y + dy[d]}); s++) x += dx[d], y += dy[d];
                best = max(best, x * x + y * y);
            }
        }
        return best;
    }
};
