class Solution {
public:
    int romanToInt(string s) {
        unordered_map<char, int> val{{'I', 1}, {'V', 5}, {'X', 10}, {'L', 50}, {'C', 100}, {'D', 500}, {'M', 1000}};
        int total = 0;
        for (size_t i = 0; i < s.size(); i++) {
            if (i + 1 < s.size() && val[s[i]] < val[s[i + 1]]) total -= val[s[i]];   // a smaller one before a bigger one subtracts
            else total += val[s[i]];
        }
        return total;
    }
};
