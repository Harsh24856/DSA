class Solution {
public:
    string multiply(string num1, string num2) {
        int m = num1.size(), n = num2.size();
        vector<int> res(m + n, 0);
        for (int i = m - 1; i >= 0; i--)
            for (int j = n - 1; j >= 0; j--) {
                int p = (num1[i] - '0') * (num2[j] - '0') + res[i + j + 1];
                res[i + j + 1] = p % 10;          // digit stays here
                res[i + j] += p / 10;             // carry moves one place left
            }
        string out;
        for (int d : res) if (!(out.empty() && d == 0)) out += char('0' + d);   // skip leading zeros
        return out.empty() ? "0" : out;
    }
};
