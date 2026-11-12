class Solution {
public:
    string countAndSay(int n) {
        string s = "1";
        for (int step = 1; step < n; step++) {
            string out;
            for (size_t i = 0; i < s.size(); ) {
                size_t j = i;
                while (j < s.size() && s[j] == s[i]) j++;  // a run of equal digits
                out += to_string(j - i) + s[i];
                i = j;
            }
            s = out;
        }
        return s;
    }
};
