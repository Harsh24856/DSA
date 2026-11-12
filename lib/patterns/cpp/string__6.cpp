// atoi as a state machine: spaces, optional sign, digits, stop; clamp to 32 bits
int myAtoi(const string& s) {
    size_t i = 0, n = s.size();
    while (i < n && s[i] == ' ') i++;
    int sign = 1;
    if (i < n && (s[i] == '+' || s[i] == '-')) sign = s[i++] == '-' ? -1 : 1;
    long long x = 0;
    while (i < n && isdigit((unsigned char)s[i])) {
        x = x * 10 + (s[i++] - '0');
        if (x > (long long)INT_MAX + 1) break;          // already out of range: stop before long long overflows
    }
    return (int)clamp(sign * x, (long long)INT_MIN, (long long)INT_MAX);
}
// @test
    H::check(myAtoi("42"), 42, "plain");
    H::check(myAtoi("   -42"), -42, "spaces and sign");
    H::check(myAtoi("1337c0d3"), 1337, "stops at a letter");
    H::check(myAtoi("0-1"), 0, "sign after digits");
    H::check(myAtoi("words and 987"), 0, "letters first");
    H::check(myAtoi("-91283472332"), INT_MIN, "clamp low");
    H::check(myAtoi("99999999999999999999999"), INT_MAX, "clamp high, no overflow");
    H::check(myAtoi("-2147483648"), INT_MIN, "exactly INT_MIN");
