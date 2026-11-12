class Solution {
    static int mask(const string& w, size_t from = 0) {
        int m = 0;
        for (size_t i = from; i < w.size(); i++) m |= 1 << (w[i] - 'a');
        return m;
    }
public:
    vector<int> findNumOfValidWords(vector<string>& words, vector<string>& puzzles) {
        unordered_map<int, int> count;           // letter set -> words with exactly that set
        for (auto& w : words) count[mask(w)]++;
        vector<int> out;
        for (auto& p : puzzles) {
            int first = 1 << (p[0] - 'a'), rest = mask(p, 1), total = 0;
            for (int sub = rest;; sub = (sub - 1) & rest) {   // every subset of the other 6 letters
                auto it = count.find(sub | first);
                if (it != count.end()) total += it->second;
                if (sub == 0) break;
            }
            out.push_back(total);
        }
        return out;
    }
};
