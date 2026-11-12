// RPN: numbers go on the stack; an operator pops right then left and pushes the result
int evalRPN(const vector<string>& tokens) {
    vector<long long> st;
    for (const string& t : tokens) {
        if (t.size() == 1 && string("+-*/").find(t[0]) != string::npos) {   // "-11" is a number, not an operator
            long long b = st.back(); st.pop_back();
            long long a = st.back(); st.pop_back();
            st.push_back(t[0] == '+' ? a + b : t[0] == '-' ? a - b : t[0] == '*' ? a * b : a / b);  // C++ / truncates toward 0
        } else {
            st.push_back(stoll(t));
        }
    }
    return (int)st.back();
}
// @test
    H::check(evalRPN({"2", "1", "+", "3", "*"}), 9, "(2 + 1) * 3");
    H::check(evalRPN({"4", "13", "5", "/", "+"}), 6, "4 + 13 / 5");
    H::check(evalRPN({"10", "6", "9", "3", "+", "-11", "*", "/", "*", "17", "+", "5", "+"}), 22, "long one");
    H::check(evalRPN({"7", "-2", "/"}), -3, "truncate toward zero");
