class Solution {
    struct Trie {
        Trie* next[26] = {};
        bool end = false;
    };

public:
    string replaceWords(vector<string>& dictionary, string sentence) {
        Trie* trie = new Trie();
        for (auto& w : dictionary) {
            Trie* node = trie;
            for (char c : w) {
                if (!node->next[c - 'a']) node->next[c - 'a'] = new Trie();
                node = node->next[c - 'a'];
            }
            node->end = true;
        }
        auto root = [&](const string& word) {
            Trie* node = trie;
            for (int i = 0; i < (int)word.size(); i++) {
                node = node->next[word[i] - 'a'];
                if (!node) return word;
                if (node->end) return word.substr(0, i + 1);   // shortest root wins
            }
            return word;
        };
        istringstream in(sentence);
        string w, out;
        while (in >> w) out += (out.empty() ? "" : " ") + root(w);
        return out;
    }
};
