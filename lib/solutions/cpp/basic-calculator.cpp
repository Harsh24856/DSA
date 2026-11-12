class Solution {
public:
    int calculate(string s) {
        long long res = 0, num = 0;
        int sign = 1;
        vector<pair<long long, int>> st;   // (result so far, sign before the bracket)
        for (char c : s) {
            if (isdigit(c)) {
                num = num * 10 + (c - '0');
            } else if (c == '+' || c == '-') {
                res += sign * num;
                num = 0;
                sign = c == '+' ? 1 : -1;
            } else if (c == '(') {
                st.push_back({res, sign});
                res = 0;
                sign = 1;
            } else if (c == ')') {
                res += sign * num;
                num = 0;
                auto [prev, psign] = st.back();
                st.pop_back();
                res = prev + psign * res;   // fold the bracket into the outer sum
            }
        }
        return res + sign * num;
    }
};
