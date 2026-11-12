class Solution {
public:
    vector<vector<string>> solveNQueens(int n) {
        vector<vector<string>> out;
        vector<bool> cols(n), d1(2 * n), d2(2 * n);       // used columns and diagonals (r - c + n, r + c)
        vector<string> board(n, string(n, '.'));
        function<void(int)> place = [&](int r) {
            if (r == n) { out.push_back(board); return; }
            for (int c = 0; c < n; c++) {
                if (cols[c] || d1[r - c + n] || d2[r + c]) continue;
                cols[c] = d1[r - c + n] = d2[r + c] = true;
                board[r][c] = 'Q';
                place(r + 1);
                board[r][c] = '.';                         // undo before trying the next column
                cols[c] = d1[r - c + n] = d2[r + c] = false;
            }
        };
        place(0);
        return out;
    }
};
