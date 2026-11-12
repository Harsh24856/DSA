class Solution {
    // each letter becomes the order in which it first appears: "abb" -> 0 1 1
    vector<int> shape(const string& w) {
        unordered_map<char, int> first;
        vector<int> out;
        for (char c : w) {
            auto it = first.try_emplace(c, first.size()).first;
            out.push_back(it->second);
        }
        return out;
    }

public:
    vector<string> findAndReplacePattern(vector<string>& words, string pattern) {
        vector<int> p = shape(pattern);
        vector<string> out;
        for (auto& w : words)
            if (shape(w) == p) out.push_back(w);
        return out;
    }
};
