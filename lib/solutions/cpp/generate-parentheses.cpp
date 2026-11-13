class Solution {
public:
    vector<string> generateParenthesis(int n) {
        vector<string> out;
        string path;
        function<void(int, int)> go = [&](int opened, int closed) {
            if ((int)path.size() == 2 * n) { out.push_back(path); return; }
            if (opened < n) { path.push_back('('); go(opened + 1, closed); path.pop_back(); }
            if (closed < opened) { path.push_back(')'); go(opened, closed + 1); path.pop_back(); }
        };
        go(0, 0);
        return out;
    }
};
