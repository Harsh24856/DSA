class Solution {
public:
    int calculate(string s) {
        vector<int> stack;   // terms to add up at the end
        long long num = 0;
        char op = '+';
        s += '+';   // flushes the last number
        for (char ch : s) {
            if (isdigit(ch)) {
                num = num * 10 + (ch - '0');
            } else if (string("+-*/").find(ch) != string::npos) {
                if (op == '+') stack.push_back(num);
                else if (op == '-') stack.push_back(-num);
                else if (op == '*') stack.back() *= num;   // * and / bind to the previous term
                else stack.back() /= num;                  // C++ division truncates toward zero
                op = ch;
                num = 0;
            }
        }
        return accumulate(stack.begin(), stack.end(), 0);
    }
};
