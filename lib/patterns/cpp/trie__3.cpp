// one trie of all words, one DFS per cell that walks grid and trie together
struct BNode { array<BNode*, 26> kids{}; string word; int live = 0; };

vector<string> findWords(vector<vector<char>>& board, const vector<string>& words) {
    BNode* root = new BNode();
    for (auto& w : words) {
        BNode* n = root;
        for (char c : w) { auto& k = n->kids[c - 'a']; if (!k) { k = new BNode(); n->live++; } n = k; }
        n->word = w;
    }
    int R = board.size(), C = board[0].size();
    vector<string> out;
    function<void(int, int, BNode*)> dfs = [&](int r, int c, BNode* parent) {
        char ch = board[r][c];
        BNode* node = parent->kids[ch - 'a'];
        if (!node->word.empty()) { out.push_back(node->word); node->word.clear(); }   // report once
        board[r][c] = '#';
        int dr[] = {1, -1, 0, 0}, dc[] = {0, 0, 1, -1};
        for (int d = 0; d < 4; d++) {
            int nr = r + dr[d], nc = c + dc[d];
            if (nr >= 0 && nr < R && nc >= 0 && nc < C && board[nr][nc] != '#' && node->kids[board[nr][nc] - 'a'])
                dfs(nr, nc, node);
        }
        board[r][c] = ch;                                                              // restore
        if (!node->live && node->word.empty()) { parent->kids[ch - 'a'] = nullptr; parent->live--; }   // prune
    };
    for (int r = 0; r < R; r++)
        for (int c = 0; c < C; c++)
            if (root->kids[board[r][c] - 'a']) dfs(r, c, root);
    return out;
}
// @test
    vector<vector<char>> b = {{'o', 'a', 'a', 'n'}, {'e', 't', 'a', 'e'}, {'i', 'h', 'k', 'r'}, {'i', 'f', 'l', 'v'}};
    H::check(H::sorted(findWords(b, {"oath", "pea", "eat", "rain"})), vector<string>{"eat", "oath"}, "word search ii");
    vector<vector<char>> b2 = {{'a', 'b'}, {'c', 'd'}};
    H::check(findWords(b2, {"abcb"}), vector<string>{}, "cannot reuse a cell");
    vector<vector<char>> b3 = {{'a', 'a'}};
    H::check(findWords(b3, {"aa", "a"}).size(), (size_t)2, "found once each");
