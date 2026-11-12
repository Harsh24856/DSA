struct WNode { unordered_map<char, WNode*> kids; bool end = false; };

void addWord(WNode* root, const string& w) {
    for (char c : w) { auto& k = root->kids[c]; if (!k) k = new WNode(); root = k; }
    root->end = true;
}

// '.' tries every child; any other letter follows one edge
bool search(WNode* node, const string& word, size_t i = 0) {
    if (i == word.size()) return node->end;
    char c = word[i];
    if (c == '.') {
        for (auto& [ch, kid] : node->kids)
            if (search(kid, word, i + 1)) return true;   // stop at the first match
        return false;
    }
    auto it = node->kids.find(c);
    return it != node->kids.end() && search(it->second, word, i + 1);
}
// @test
    WNode* root = new WNode();
    for (string w : {"bad", "dad", "mad"}) addWord(root, w);
    H::check(search(root, "pad"), false, "no match");
    H::check(search(root, "bad"), true, "exact");
    H::check(search(root, ".ad"), true, "leading dot");
    H::check(search(root, "b.."), true, "trailing dots");
    H::check(search(root, "b."), false, "too short");
    H::check(search(root, "..."), true, "all dots");
