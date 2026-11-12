class WordFilter {
    unordered_map<string, int> index;          // "prefix#suffix" -> latest word index
public:
    WordFilter(vector<string>& words) {
        for (int i = 0; i < (int)words.size(); i++) {
            const string& w = words[i];
            for (size_t p = 0; p <= w.size(); p++)
                for (size_t s = 0; s <= w.size(); s++)
                    index[w.substr(0, p) + "#" + w.substr(s)] = i;   // later words overwrite earlier ones
        }
    }

    int f(string pref, string suff) {
        auto it = index.find(pref + "#" + suff);
        return it == index.end() ? -1 : it->second;
    }
};
// @test
    vector<string> one{"apple"};
    H::check(WordFilter(one).f("a", "e"), 0, "apple");
    vector<string> words{"apple", "ample", "bat"};
    WordFilter wf(words);
    H::check(vector<int>{wf.f("a", "le"), wf.f("ap", "e"), wf.f("b", "t"), wf.f("c", ""), wf.f("", "")}, vector<int>{1, 0, 2, -1, 2}, "more");
