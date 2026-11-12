class Solution {
    void keep(vector<vector<char>>& board, int r, int c) {   // mark an O connected to the border
        if (r < 0 || r >= (int)board.size() || c < 0 || c >= (int)board[0].size() || board[r][c] != 'O') return;
        board[r][c] = '#';
        keep(board, r + 1, c); keep(board, r - 1, c); keep(board, r, c + 1); keep(board, r, c - 1);
    }

public:
    void solve(vector<vector<char>>& board) {
        int R = board.size(), C = board[0].size();
        for (int r = 0; r < R; r++) { keep(board, r, 0); keep(board, r, C - 1); }
        for (int c = 0; c < C; c++) { keep(board, 0, c); keep(board, R - 1, c); }
        for (auto& row : board)
            for (char& x : row) x = x == '#' ? 'O' : 'X';  // marked ones stay, every other O is captured
    }
};
// @test
    vector<vector<char>> b = {{'X', 'X', 'X', 'X'}, {'X', 'O', 'O', 'X'}, {'X', 'X', 'O', 'X'}, {'X', 'O', 'X', 'X'}};
    Solution().solve(b);
    H::check(b, vector<vector<char>>{{'X', 'X', 'X', 'X'}, {'X', 'X', 'X', 'X'}, {'X', 'X', 'X', 'X'}, {'X', 'O', 'X', 'X'}}, "surrounded-regions 1");
    vector<vector<char>> b2 = {{'X'}};
    Solution().solve(b2);
    H::check(b2, vector<vector<char>>{{'X'}}, "surrounded-regions 2");
