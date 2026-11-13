// A string builder from scratch: a growable char buffer, plus the core string algorithms.
class StringBuilder {
    char* buf;
    size_t n = 0, cap;

    void grow(size_t need) {                     // double until it fits: O(1) amortised per char
        if (need <= cap) return;
        while (cap < need) cap *= 2;
        char* fresh = new char[cap];
        memcpy(fresh, buf, n);
        delete[] buf;
        buf = fresh;
    }

public:
    explicit StringBuilder(const string& s = "") : buf(new char[8]), cap(8) { append(s); }
    ~StringBuilder() { delete[] buf; }
    StringBuilder(const StringBuilder&) = delete;
    StringBuilder& operator=(const StringBuilder&) = delete;

    StringBuilder& append(const string& s) {
        grow(n + s.size());
        memcpy(buf + n, s.data(), s.size());
        n += s.size();
        return *this;
    }
    StringBuilder& append(char c) { grow(n + 1); buf[n++] = c; return *this; }
    char& operator[](size_t i) { return buf[i]; }     // mutable, unlike a Java or Python string
    size_t size() const { return n; }
    size_t capacity() const { return cap; }
    StringBuilder& reverse() {
        for (size_t i = 0, j = n; i + 1 < j; i++, j--) swap(buf[i], buf[j - 1]);
        return *this;
    }
    string str() const { return string(buf, n); }     // one O(n) copy at the end
};

// lexicographic order: the first differing char decides, else the shorter string is first
int compareStr(const string& a, const string& b) {
    for (size_t i = 0; i < a.size() && i < b.size(); i++)
        if (a[i] != b[i]) return (unsigned char)a[i] < (unsigned char)b[i] ? -1 : 1;
    return (a.size() > b.size()) - (a.size() < b.size());
}

// polynomial hash mod 2^61 - 1; equal strings always hash equal, different ones rarely collide
uint64_t polyHash(const string& s, uint64_t base = 131) {
    const uint64_t MOD = (1ULL << 61) - 1;
    uint64_t h = 0;
    for (unsigned char c : s) h = (uint64_t)(((__uint128_t)h * base + c) % MOD);
    return h;
}

bool isAnagram(const string& a, const string& b) {
    if (a.size() != b.size()) return false;
    array<int, 26> count{};                           // one counter per lowercase letter
    for (size_t i = 0; i < a.size(); i++) count[a[i] - 'a']++, count[b[i] - 'a']--;
    return all_of(count.begin(), count.end(), [](int c) { return c == 0; });
}

// naive search, O(n * m) worst case; first index or -1
int findStr(const string& text, const string& pat) {
    for (size_t i = 0; i + pat.size() <= text.size(); i++) {
        size_t j = 0;
        while (j < pat.size() && text[i + j] == pat[j]) j++;
        if (j == pat.size()) return (int)i;
    }
    return -1;
}
// @test
    StringBuilder sb("ab");
    sb.append("cde").append("fghij").append('k');
    H::check(sb.str(), string("abcdefghijk"), "append");
    H::check(sb.size(), (size_t)11, "size");
    H::check(sb.capacity(), (size_t)16, "capacity doubled");
    H::check(sb[2], 'c', "index");
    sb[0] = 'A';
    H::check(sb.reverse().str(), string("kjihgfedcbA"), "set and reverse");
    H::check(compareStr("apple", "apply"), -1, "compare by first difference");
    H::check(compareStr("b", "abc"), 1, "length does not decide first");
    H::check(compareStr("ab", "abc"), -1, "prefix comes first");
    H::check(compareStr("x", "x"), 0, "equal");
    H::check(compareStr("apple", "apply") < 0, string("apple") < string("apply"), "matches std::string");
    H::check(polyHash("abc") == polyHash(string("ab") + "c"), true, "equal strings, equal hash");
    H::check(polyHash("abc") == polyHash("acb"), false, "order matters");
    H::check(isAnagram("listen", "silent"), true, "anagram");
    H::check(isAnagram("rat", "car"), false, "not anagram");
    H::check(findStr("hello world", "o w"), 4, "find");
    H::check(findStr("aaab", "ab"), 2, "find after partial match");
    H::check(findStr("abc", "d"), -1, "find missing");
    H::check(findStr("abc", "abc"), (int)string("abc").find("abc"), "matches std::string::find");
