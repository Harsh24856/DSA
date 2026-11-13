class Solution {
public:
    bool isRobotBounded(string instructions) {
        const int dx[4] = {0, 1, 0, -1}, dy[4] = {1, 0, -1, 0};   // north, east, south, west
        int x = 0, y = 0, d = 0;
        for (char ch : instructions) {
            if (ch == 'G') x += dx[d], y += dy[d];
            else if (ch == 'L') d = (d + 3) % 4;
            else d = (d + 1) % 4;
        }
        return (x == 0 && y == 0) || d != 0;              // home, or turned: back within 4 passes
    }
};
