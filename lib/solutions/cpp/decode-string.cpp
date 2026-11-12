class Solution {
public:
    string decodeString(string s) {
        vector<pair<string, int>> stack;                 // (text before the bracket, its repeat count)
        string cur;
        int num = 0;
        for (char ch : s) {
            if (isdigit(ch)) num = num * 10 + (ch - '0');
            else if (ch == '[') { stack.push_back({cur, num}); cur = ""; num = 0; }
            else if (ch == ']') {
                auto [prev, k] = stack.back(); stack.pop_back();
                string rep;
                while (k--) rep += cur;
                cur = prev + rep;
            }
            else cur += ch;
        }
        return cur;
    }
};
