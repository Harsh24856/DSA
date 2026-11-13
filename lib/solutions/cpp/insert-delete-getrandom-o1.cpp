class RandomizedSet {
    vector<int> vals;                                     // for random picks
    unordered_map<int, int> pos;                          // value -> index in vals
public:
    RandomizedSet() {}

    bool insert(int val) {
        if (pos.count(val)) return false;
        pos[val] = vals.size();
        vals.push_back(val);
        return true;
    }

    bool remove(int val) {
        auto it = pos.find(val);
        if (it == pos.end()) return false;
        int i = it->second, last = vals.back();
        vals[i] = last;                                   // the last item fills the hole: no shifting
        pos[last] = i;
        vals.pop_back();
        pos.erase(val);
        return true;
    }

    int getRandom() { return vals[rand() % vals.size()]; }
};
// @test
    RandomizedSet s;
    H::check(s.insert(1), true, "insert 1");
    H::check(s.remove(2), false, "remove missing");
    H::check(s.insert(2), true, "insert 2");
    int r = s.getRandom();
    H::check(r == 1 || r == 2, true, "random in set");
    H::check(s.remove(1), true, "remove 1");
    H::check(s.insert(2), false, "insert duplicate");
    H::check(s.getRandom(), 2, "only 2 left");
    RandomizedSet t;
    for (int x = 0; x < 10; x++) t.insert(x);
    for (int x = 0; x < 10; x += 2) t.remove(x);
    set<int> seen;
    for (int k = 0; k < 300; k++) seen.insert(t.getRandom());
    H::check(vector<int>(seen.begin(), seen.end()), vector<int>{1, 3, 5, 7, 9}, "random covers the set");
