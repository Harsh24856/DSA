// state simulation: build the next state from the current one; here each run of equal digits becomes count + digit
string countAndSay(int n) {
    string s = "1";
    for (int step = 1; step < n; step++) {
        string next;
        for (size_t i = 0; i < s.size(); ) {
            size_t j = i;
            while (j < s.size() && s[j] == s[i]) j++;            // run s[i..j-1]
            next += to_string(j - i) + s[i];
            i = j;
        }
        s = move(next);                          // never edit the state you are still reading
    }
    return s;
}
// @test
    H::check(countAndSay(1), string("1"), "n = 1");
    H::check(countAndSay(4), string("1211"), "n = 4");
    H::check(countAndSay(5), string("111221"), "n = 5");
    H::check(countAndSay(6), string("312211"), "n = 6");
