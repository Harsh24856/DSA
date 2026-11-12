class Solution {
public:
    string longestWord(vector<string>& words) {
        sort(words.begin(), words.end());                // a word comes after all its prefixes
        unordered_set<string> built = {""};
        string best;
        for (auto& w : words)
            if (built.count(w.substr(0, w.size() - 1))) {
                built.insert(w);
                if (w.size() > best.size()) best = w;
            }
        return best;
    }
};
