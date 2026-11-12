class Solution {
public:
    string shiftingLetters(string s, vector<vector<int>>& shifts) {
        vector<int> diff(s.size() + 1, 0);
        for (auto& sh : shifts) {
            int v = sh[2] ? 1 : -1;
            diff[sh[0]] += v;
            diff[sh[1] + 1] -= v;
        }
        int run = 0;
        for (size_t i = 0; i < s.size(); i++) {
            run += diff[i];                                // total shift at i
            s[i] = 'a' + ((s[i] - 'a' + run) % 26 + 26) % 26;   // keep the remainder non-negative
        }
        return s;
    }
};
