// greedy stack: a smaller digit arriving makes the larger digit before it worth deleting
string removeKdigits(const string& num, int k) {
    string st;                                   // stays non-decreasing while deletions remain
    for (char d : num) {
        while (k > 0 && !st.empty() && st.back() > d) { st.pop_back(); k--; }
        st.push_back(d);
    }
    st.resize(st.size() - min<size_t>(k, st.size()));      // still owe deletions: the tail is largest
    size_t nz = st.find_first_not_of('0');
    return nz == string::npos ? "0" : st.substr(nz);
}
// @test
    H::check(removeKdigits("1432219", 3), string("1219"), "classic");
    H::check(removeKdigits("10200", 1), string("200"), "leading zeros");
    H::check(removeKdigits("10", 2), string("0"), "everything removed");
    H::check(removeKdigits("112", 1), string("11"), "cut the tail");
    H::check(removeKdigits("123456", 3), string("123"), "rising: cut the end");
