class Solution {
    struct Trie {
        unordered_map<char, unique_ptr<Trie>> kids;
        string word;                                       // set at the end of a word, cleared once found
    };
    vector<string> out;

    void dfs(vector<vector<char>>& board, int r, int c, Trie* parent) {
        char ch = board[r][c];
        Trie* node = parent->kids[ch].get();
        if (!node->word.empty()) { out.push_back(node->word); node->word.clear(); }   // report each word once
        board[r][c] = '#';                                 // mark the cell used on this path
        int dr[] = {1, -1, 0, 0}, dc[] = {0, 0, 1, -1};
        for (int d = 0; d < 4; d++) {
            int nr = r + dr[d], nc = c + dc[d];
            if (nr >= 0 && nr < (int)board.size() && nc >= 0 && nc < (int)board[0].size() && node->kids.count(board[nr][nc]))
                dfs(board, nr, nc, node);
        }
        board[r][c] = ch;
        if (node->kids.empty() && node->word.empty()) parent->kids.erase(ch);   // prune a finished branch
    }
public:
    vector<string> findWords(vector<vector<char>>& board, vector<string>& words) {
        Trie root;
        for (const string& w : words) {
            Trie* node = &root;
            for (char ch : w) {
                auto& next = node->kids[ch];
                if (!next) next = make_unique<Trie>();
                node = next.get();
            }
            node->word = w;
        }
        out.clear();
        for (int r = 0; r < (int)board.size(); r++)
            for (int c = 0; c < (int)board[0].size(); c++)
                if (root.kids.count(board[r][c])) dfs(board, r, c, &root);
        return out;
    }
};
// @test
    vector<vector<char>> b1{{'o', 'a', 'a', 'n'}, {'e', 't', 'a', 'e'}, {'i', 'h', 'k', 'r'}, {'i', 'f', 'l', 'v'}};
    vector<string> w1{"oath", "pea", "eat", "rain"};
    H::check(H::sorted(Solution().findWords(b1, w1)), vector<string>{"eat", "oath"}, "findWords");
    vector<vector<char>> b2{{'a', 'b'}, {'c', 'd'}};
    vector<string> w2{"abcb"};
    H::check(Solution().findWords(b2, w2), vector<string>{}, "none");
    vector<vector<char>> b3{{'a', 'a'}};
    vector<string> w3{"aaa", "a", "aa"};
    H::check(H::sorted(Solution().findWords(b3, w3)), vector<string>{"a", "aa"}, "dup");
