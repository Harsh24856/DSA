class Solution {
    // used[r][v]: digit v + 1 is already in row r (and the same for columns and boxes)
    bool rows[9][9] = {}, cols[9][9] = {}, boxes[9][9] = {};
    vector<pair<int, int>> empty;
    bool go(vector<vector<char>>& board, size_t k) {
        if (k == empty.size()) return true;
        auto [r, c] = empty[k];
        int b = r / 3 * 3 + c / 3;
        for (int v = 0; v < 9; v++) {
            if (rows[r][v] || cols[c][v] || boxes[b][v]) continue;
            board[r][c] = '1' + v;
            rows[r][v] = cols[c][v] = boxes[b][v] = true;
            if (go(board, k + 1)) return true;
            rows[r][v] = cols[c][v] = boxes[b][v] = false;   // undo and try the next digit
        }
        board[r][c] = '.';
        return false;
    }
public:
    void solveSudoku(vector<vector<char>>& board) {
        for (int r = 0; r < 9; r++)
            for (int c = 0; c < 9; c++) {
                char v = board[r][c];
                if (v == '.') empty.push_back({r, c});
                else rows[r][v - '1'] = cols[c][v - '1'] = boxes[r / 3 * 3 + c / 3][v - '1'] = true;
            }
        go(board, 0);
    }
};
// @test
    vector<string> start{"53..7....", "6..195...", ".98....6.", "8...6...3", "4..8.3..1", "7...2...6", ".6....28.", "...419..5", "....8..79"};
    vector<vector<char>> b;
    for (auto& row : start) b.push_back(vector<char>(row.begin(), row.end()));
    Solution().solveSudoku(b);
    vector<string> got;
    for (auto& row : b) got.push_back(string(row.begin(), row.end()));
    H::check(got, vector<string>{"534678912", "672195348", "198342567", "859761423", "426853791", "713924856", "961537284", "287419635", "345286179"}, "solveSudoku");
