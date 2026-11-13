class Solution {
public:
    vector<string> letterCombinations(string digits) {
        if (digits.empty()) return {};
        const vector<string> keys = {"", "", "abc", "def", "ghi", "jkl", "mno", "pqrs", "tuv", "wxyz"};
        vector<string> out;
        string path;
        function<void(size_t)> go = [&](size_t i) {
            if (i == digits.size()) { out.push_back(path); return; }
            for (char ch : keys[digits[i] - '0']) {
                path.push_back(ch);
                go(i + 1);
                path.pop_back();
            }
        };
        go(0);
        return out;
    }
};
