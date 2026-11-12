class Solution {
public:
    int maximumLength(string s) {
        vector<int> runs[26];   // lengths of each letter's runs
        for (int i = 0; i < (int)s.size();) {
            int j = i;
            while (j < (int)s.size() && s[j] == s[i]) j++;
            runs[s[i] - 'a'].push_back(j - i);
            i = j;
        }
        int best = -1;
        for (auto& lens : runs) {
            if (lens.empty()) continue;   // letter not in s
            lens.push_back(0);
            lens.push_back(0);
            sort(lens.rbegin(), lens.rend());
            int a = lens[0], b = lens[1], c = lens[2];   // three longest runs
            best = max({best, a - 2, min(a - 1, b), c});
        }
        return best > 0 ? best : -1;
    }
};
