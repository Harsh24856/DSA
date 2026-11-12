// valid palindrome: skip non-alphanumerics on both sides, compare case-insensitively, move inward
bool isPal(const string& s) {
    int L = 0, R = (int)s.size() - 1;
    while (L < R) {
        while (L < R && !isalnum((unsigned char)s[L])) L++;    // the inner loops need the L < R guard too
        while (L < R && !isalnum((unsigned char)s[R])) R--;
        if (tolower((unsigned char)s[L]) != tolower((unsigned char)s[R])) return false;
        L++; R--;
    }
    return true;
}
// @test
    H::check(isPal("A man, a plan, a canal: Panama"), true, "panama");
    H::check(isPal("race a car"), false, "race a car");
    H::check(isPal(" "), true, "only a space");
    H::check(isPal("0P"), false, "digit and letter");
    H::check(isPal(""), true, "empty");
