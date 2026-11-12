class Solution {
public:
    void gameOfLife(vector<vector<int>>& board) {
        int m = board.size(), n = board[0].size();
        for (int i = 0; i < m; i++)
            for (int j = 0; j < n; j++) {
                int live = -(board[i][j] & 1);   // bit 0 = now, bit 1 = next
                for (int x = max(0, i - 1); x < min(m, i + 2); x++)
                    for (int y = max(0, j - 1); y < min(n, j + 2); y++) live += board[x][y] & 1;
                if (live == 3 || (live == 2 && (board[i][j] & 1))) board[i][j] |= 2;
            }
        for (auto& row : board)
            for (int& v : row) v >>= 1;   // next becomes now
    }
};
// @test
    for (auto [b, exp] : vector<pair<vector<vector<int>>, vector<vector<int>>>>{
             {{{0, 1, 0}, {0, 0, 1}, {1, 1, 1}, {0, 0, 0}}, {{0, 0, 0}, {1, 0, 1}, {0, 1, 1}, {0, 1, 0}}},
             {{{1, 1}, {1, 0}}, {{1, 1}, {1, 1}}}}) {
        Solution().gameOfLife(b);
        H::check(b, exp, "gameOfLife");
    }
