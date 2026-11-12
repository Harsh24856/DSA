class Solution {
public:
    int evalRPN(vector<string>& tokens) {
        vector<long long> stack;
        for (auto& t : tokens) {
            if (t == "+" || t == "-" || t == "*" || t == "/") {
                long long b = stack.back(); stack.pop_back();
                long long a = stack.back(); stack.pop_back();
                if (t == "+") stack.push_back(a + b);
                else if (t == "-") stack.push_back(a - b);
                else if (t == "*") stack.push_back(a * b);
                else stack.push_back(a / b);             // C++ division already truncates toward zero
            } else {
                stack.push_back(stoll(t));
            }
        }
        return stack[0];
    }
};
