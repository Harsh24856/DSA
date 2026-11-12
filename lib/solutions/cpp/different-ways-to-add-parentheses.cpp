class Solution {
    unordered_map<string, vector<int>> memo;
public:
    vector<int> diffWaysToCompute(string expression) {
        auto it = memo.find(expression);
        if (it != memo.end()) return it->second;
        vector<int> out;
        for (size_t i = 0; i < expression.size(); i++) {
            char ch = expression[i];
            if (ch != '+' && ch != '-' && ch != '*') continue;
            // ch is the last operator applied: every left result with every right result
            for (int a : diffWaysToCompute(expression.substr(0, i)))
                for (int b : diffWaysToCompute(expression.substr(i + 1)))
                    out.push_back(ch == '+' ? a + b : ch == '-' ? a - b : a * b);
        }
        if (out.empty()) out.push_back(stoi(expression));   // just a number
        return memo[expression] = out;
    }
};
// @test
    H::check(H::sorted(Solution().diffWaysToCompute("2-1-1")), vector<int>{0, 2}, "2-1-1");
    H::check(H::sorted(Solution().diffWaysToCompute("2*3-4*5")), vector<int>{-34, -14, -10, -10, 10}, "2*3-4*5");
    H::check(Solution().diffWaysToCompute("7"), vector<int>{7}, "7");
