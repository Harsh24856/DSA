// the most recently opened bracket must close first: push openers, a closer must match the top
bool isValid(const string& s) {
    string st;
    for (char ch : s) {
        if (ch == '(' || ch == '[' || ch == '{') { st.push_back(ch); continue; }
        char want = ch == ')' ? '(' : ch == ']' ? '[' : '{';
        if (st.empty() || st.back() != want) return false;    // check empty before reading the top
        st.pop_back();
    }
    return st.empty();
}
// @test
    H::check(isValid("()[]{}"), true, "flat");
    H::check(isValid("{[()]}"), true, "nested");
    H::check(isValid("(]"), false, "mismatch");
    H::check(isValid("("), false, "unclosed");
    H::check(isValid(")"), false, "closer first");
    H::check(isValid(""), true, "empty");
