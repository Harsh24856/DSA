class RandomizedCollection {
    vector<int> vals;
    unordered_map<int, unordered_set<int>> pos;   // value -> indexes in vals
public:
    RandomizedCollection() {}

    bool insert(int val) {
        pos[val].insert(vals.size());
        vals.push_back(val);
        return pos[val].size() == 1;
    }

    bool remove(int val) {
        auto& p = pos[val];
        if (p.empty()) return false;
        int i = *p.begin(), last = vals.back();
        p.erase(p.begin());
        vals[i] = last;                   // move the last value into the hole
        pos[last].insert(i);
        pos[last].erase(vals.size() - 1);
        vals.pop_back();
        return true;
    }

    int getRandom() { return vals[rand() % vals.size()]; }
};
// @test
    RandomizedCollection c;
    H::check(c.insert(1), true, "insert 1");
    H::check(c.insert(1), false, "insert 1 again");
    H::check(c.insert(2), true, "insert 2");
    int r = c.getRandom();
    H::check(r == 1 || r == 2, true, "getRandom");
    H::check(c.remove(1), true, "remove 1");
    H::check(c.remove(3), false, "remove 3");
    set<int> seen;
    for (int i = 0; i < 200; i++) seen.insert(c.getRandom());
    H::check(vector<int>(seen.begin(), seen.end()), vector<int>{1, 2}, "left {1, 2}");
    H::check(c.remove(2), true, "remove 2");
    H::check(c.remove(1), true, "remove last 1");
    H::check(c.remove(1), false, "remove 1 from empty");
    H::check(c.insert(5), true, "insert into empty");
    H::check(c.getRandom(), 5, "only 5 left");
