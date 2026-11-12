class Solution {
public:
    vector<int> findSubstring(string s, vector<string>& words) {
        int L = words[0].size(), k = words.size(), n = s.size();
        unordered_map<string, int> need;
        for (auto& w : words) need[w]++;
        vector<int> out;
        for (int off = 0; off < L; off++) {           // one sliding window per offset
            unordered_map<string, int> seen;
            int left = off, used = 0;
            for (int right = off; right + L <= n; right += L) {
                string w = s.substr(right, L);
                if (!need.count(w)) {                 // a foreign word: restart after it
                    seen.clear();
                    used = 0;
                    left = right + L;
                    continue;
                }
                seen[w]++;
                used++;
                while (seen[w] > need[w]) {           // too many copies: shrink from the left
                    seen[s.substr(left, L)]--;
                    used--;
                    left += L;
                }
                if (used == k) {
                    out.push_back(left);
                    seen[s.substr(left, L)]--;
                    used--;
                    left += L;
                }
            }
        }
        sort(out.begin(), out.end());
        return out;
    }
};
