class Solution {
    static bool valid(const string& t) {
        int bal = 0;
        for (char c : t) {
            if (c == '(') bal++;
            else if (c == ')' && --bal < 0) return false;
        }
        return bal == 0;
    }

public:
    vector<string> removeInvalidParentheses(string s) {
        unordered_set<string> level{s};   // BFS: every string with the same number of removals
        while (true) {
            vector<string> good;
            for (auto& t : level)
                if (valid(t)) good.push_back(t);
            if (!good.empty()) return good;   // the first level with a valid string has the fewest removals
            unordered_set<string> next;
            for (auto& t : level)
                for (size_t i = 0; i < t.size(); i++)
                    if (t[i] == '(' || t[i] == ')') next.insert(t.substr(0, i) + t.substr(i + 1));
            level = next;
        }
    }
};
// @test
    H::check(H::sorted(Solution().removeInvalidParentheses("()())()")), vector<string>{"(())()", "()()()"}, "a");
    H::check(H::sorted(Solution().removeInvalidParentheses("(a)())()")), vector<string>{"(a())()", "(a)()()"}, "b");
    H::check(H::sorted(Solution().removeInvalidParentheses(")(")), vector<string>{""}, "c");
