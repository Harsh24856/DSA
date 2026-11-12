class Solution {
    unordered_map<string, vector<string>> parents;
    vector<vector<string>> out;
    void build(const string& w, const string& begin, vector<string>& path) {
        if (w == begin) { out.emplace_back(path.rbegin(), path.rend()); return; }
        for (auto& p : parents[w]) {
            path.push_back(p);
            build(p, begin, path);
            path.pop_back();
        }
    }
public:
    vector<vector<string>> findLadders(string beginWord, string endWord, vector<string>& wordList) {
        unordered_set<string> words(wordList.begin(), wordList.end());
        if (!words.count(endWord)) return {};
        unordered_set<string> level{beginWord};
        bool found = false;
        words.erase(beginWord);
        while (!level.empty() && !found) {
            unordered_map<string, vector<string>> nxt;
            for (auto& w : level)
                for (size_t i = 0; i < w.size(); i++)
                    for (char ch = 'a'; ch <= 'z'; ch++) {
                        string t = w;
                        t[i] = ch;
                        if (words.count(t)) nxt[t].push_back(w);
                    }
            level.clear();
            for (auto& [t, ps] : nxt) {
                words.erase(t);                            // remove only after the whole level
                auto& dst = parents[t];
                dst.insert(dst.end(), ps.begin(), ps.end());
                level.insert(t);
            }
            found = nxt.count(endWord);
        }
        if (found) { vector<string> path{endWord}; build(endWord, beginWord, path); }
        return out;
    }
};
// @test
    vector<string> w1{"hot","dot","dog","lot","log","cog"};
    H::check(H::sorted(Solution().findLadders("hit", "cog", w1)),
             vector<vector<string>>{{"hit","hot","dot","dog","cog"},{"hit","hot","lot","log","cog"}}, "findLadders a");
    vector<string> w2{"hot","dot","dog","lot","log"};
    H::check(Solution().findLadders("hit", "cog", w2), vector<vector<string>>{}, "findLadders b");
