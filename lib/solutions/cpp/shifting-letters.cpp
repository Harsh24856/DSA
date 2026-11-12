class Solution {
public:
    string shiftingLetters(string s, vector<int>& shifts) {
        long long total = 0;
        for (int i = s.size() - 1; i >= 0; i--) {   // letter i moves by the sum of shifts[i..]
            total = (total + shifts[i]) % 26;
            s[i] = 'a' + (s[i] - 'a' + total) % 26;
        }
        return s;
    }
};
