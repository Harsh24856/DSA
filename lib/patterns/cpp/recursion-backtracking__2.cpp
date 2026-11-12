// handle both ends, recurse on the inside; l >= r covers odd and even lengths
void reverseString(vector<char>& s, int l, int r) {
    if (l >= r) return;
    swap(s[l], s[r]);
    reverseString(s, l + 1, r - 1);
}
void reverseString(vector<char>& s) { reverseString(s, 0, (int)s.size() - 1); }
// @test
    vector<char> a = {'h', 'e', 'l', 'l', 'o'};
    reverseString(a);
    H::check(a, vector<char>{'o', 'l', 'l', 'e', 'h'}, "odd length");
    vector<char> b = {'a', 'b', 'c', 'd'};
    reverseString(b);
    H::check(b, vector<char>{'d', 'c', 'b', 'a'}, "even length");
    vector<char> c;
    reverseString(c);
    H::check(c, vector<char>{}, "empty");
