class Solution {
public:
    int ladderLength(string beginWord, string endWord, vector<string>& wordList) {
        unordered_set<string> words(wordList.begin(), wordList.end());
        if (!words.count(endWord)) return 0;
        queue<pair<string, int>> q;
        unordered_set<string> seen = {beginWord};
        q.push({beginWord, 1});
        while (!q.empty()) {
            auto [w, d] = q.front(); q.pop();
            if (w == endWord) return d;
            for (size_t i = 0; i < w.size(); i++)
                for (char ch = 'a'; ch <= 'z'; ch++) {   // every word one letter away
                    string n = w;
                    n[i] = ch;
                    if (words.count(n) && !seen.count(n)) { seen.insert(n); q.push({n, d + 1}); }
                }
        }
        return 0;
    }
};
