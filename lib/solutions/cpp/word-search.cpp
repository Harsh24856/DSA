class Solution {
    bool dfs(vector<vector<char>>& board, const string& word, int r, int c, int i) {
        if (i == (int)word.size()) return true;
        if (r < 0 || r >= (int)board.size() || c < 0 || c >= (int)board[0].size() || board[r][c] != word[i]) return false;
        board[r][c] = '#';                               // mark the cell as used on this path
        bool found = dfs(board, word, r + 1, c, i + 1) || dfs(board, word, r - 1, c, i + 1) ||
                     dfs(board, word, r, c + 1, i + 1) || dfs(board, word, r, c - 1, i + 1);
        board[r][c] = word[i];                           // undo
        return found;
    }

public:
    bool exist(vector<vector<char>>& board, string word) {
        for (int r = 0; r < (int)board.size(); r++)
            for (int c = 0; c < (int)board[0].size(); c++)
                if (dfs(board, word, r, c, 0)) return true;
        return false;
    }
};
