class CombinationIterator {
    string chars;
    vector<int> idx;       // indexes of the next combination, in order
    bool more = true;
public:
    CombinationIterator(string characters, int combinationLength) : chars(characters), idx(combinationLength) {
        iota(idx.begin(), idx.end(), 0);   // the first combination is the first k letters
    }

    string next() {
        string out;
        for (int i : idx) out += chars[i];
        // advance: bump the rightmost index that still has room, then reset those after it
        int k = idx.size(), n = chars.size(), i = k - 1;
        while (i >= 0 && idx[i] == n - k + i) i--;
        if (i < 0) more = false;
        else {
            idx[i]++;
            for (int j = i + 1; j < k; j++) idx[j] = idx[j - 1] + 1;
        }
        return out;
    }

    bool hasNext() { return more; }
};
// @test
    CombinationIterator it("abc", 2);
    H::check(it.next(), string("ab"), "next 1");
    H::check(it.hasNext(), true, "hasNext 1");
    H::check(it.next(), string("ac"), "next 2");
    H::check(it.hasNext(), true, "hasNext 2");
    H::check(it.next(), string("bc"), "next 3");
    H::check(it.hasNext(), false, "hasNext 3");
