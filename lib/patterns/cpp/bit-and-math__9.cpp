// peel digits with % 10, rebuild with * 10 +; check overflow before it happens
int reverseInt(int x) {
    int rev = 0;
    while (x) {
        int d = x % 10;                       // C++ keeps the sign: -123 % 10 == -3
        x /= 10;
        if (rev > INT_MAX / 10 || (rev == INT_MAX / 10 && d > 7)) return 0;
        if (rev < INT_MIN / 10 || (rev == INT_MIN / 10 && d < -8)) return 0;
        rev = rev * 10 + d;
    }
    return rev;
}
// @test
    H::check(reverseInt(123), 321, "positive");
    H::check(reverseInt(-123), -321, "negative");
    H::check(reverseInt(120), 21, "trailing zero");
    H::check(reverseInt(1534236469), 0, "overflow");
    H::check(reverseInt(-2147483648), 0, "INT_MIN");
