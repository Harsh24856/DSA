class Solution {
public:
    int maxLength(vector<string>& arr) {
        vector<pair<int, int>> combos{{0, 0}};               // (letter mask, length) of each unique concatenation
        for (const string& w : arr) {
            int m = 0;
            bool dup = false;
            for (char ch : w) {
                int b = 1 << (ch - 'a');
                if (m & b) { dup = true; break; }            // the word repeats a letter itself
                m |= b;
            }
            if (dup) continue;
            size_t size = combos.size();
            for (size_t i = 0; i < size; i++)
                if (!(combos[i].first & m)) combos.push_back({combos[i].first | m, combos[i].second + (int)w.size()});
        }
        int best = 0;
        for (auto& [mask, n] : combos) best = max(best, n);
        return best;
    }
};
