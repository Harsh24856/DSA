class MagicDictionary {
    unordered_set<string> words;
    unordered_map<string, int> pat;   // "h*llo" -> how many words fit it
public:
    MagicDictionary() {}

    void buildDict(vector<string> dictionary) {
        words = unordered_set<string>(dictionary.begin(), dictionary.end());
        pat.clear();
        for (auto& w : dictionary)
            for (size_t i = 0; i < w.size(); i++) pat[w.substr(0, i) + "*" + w.substr(i + 1)]++;
    }

    bool search(string searchWord) {
        for (size_t i = 0; i < searchWord.size(); i++) {
            auto it = pat.find(searchWord.substr(0, i) + "*" + searchWord.substr(i + 1));
            int c = it == pat.end() ? 0 : it->second;
            // another word fits, or the one word that fits is not searchWord itself
            if (c > 1 || (c == 1 && !words.count(searchWord))) return true;
        }
        return false;
    }
};
// @test
    MagicDictionary m;
    m.buildDict({"hello", "leetcode"});
    H::check(m.search("hello"), false, "hello");
    H::check(m.search("hhllo"), true, "hhllo");
    H::check(m.search("hell"), false, "hell");
    H::check(m.search("leetcoded"), false, "leetcoded");
    m.buildDict({"hello", "hallo"});
    H::check(m.search("hello"), true, "self with a neighbour");
