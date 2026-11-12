class LFUCache {
    int cap, minFreq = 0;
    unordered_map<int, pair<int, int>> key;               // key -> (value, uses)
    unordered_map<int, list<int>> bucket;                 // uses -> keys, oldest first
    unordered_map<int, list<int>::iterator> where;        // key -> its place in its bucket

    void touch(int k) {
        auto& [val, f] = key[k];
        bucket[f].erase(where[k]);
        if (bucket[f].empty()) {
            bucket.erase(f);
            if (minFreq == f) minFreq = f + 1;
        }
        f++;
        bucket[f].push_back(k);
        where[k] = prev(bucket[f].end());
    }

public:
    LFUCache(int capacity) : cap(capacity) {}

    int get(int k) {
        if (!key.count(k)) return -1;
        touch(k);
        return key[k].first;
    }

    void put(int k, int value) {
        if (cap == 0) return;
        if (key.count(k)) {
            key[k].first = value;
            touch(k);
            return;
        }
        if ((int)key.size() == cap) {
            int old = bucket[minFreq].front();
            bucket[minFreq].pop_front();
            if (bucket[minFreq].empty()) bucket.erase(minFreq);
            key.erase(old);
            where.erase(old);
        }
        key[k] = {value, 1};
        bucket[1].push_back(k);
        where[k] = prev(bucket[1].end());
        minFreq = 1;
    }
};
// @test
    LFUCache c(2);
    c.put(1, 1);
    c.put(2, 2);
    H::check(c.get(1), 1, "get 1");
    c.put(3, 3);
    H::check(c.get(2), -1, "evicted 2");
    H::check(c.get(3), 3, "get 3");
    c.put(4, 4);
    H::check(c.get(1), -1, "evicted 1");
    H::check(c.get(3), 3, "get 3 again");
    H::check(c.get(4), 4, "get 4");
    LFUCache d(2);
    d.put(1, 1);
    d.put(2, 2);
    d.put(1, 10);
    d.put(3, 3);
    H::check(d.get(2), -1, "tie evicts 2");
    H::check(d.get(1), 10, "updated 1");
    H::check(d.get(3), 3, "get 3 tie");
    LFUCache z(0);
    z.put(0, 0);
    H::check(z.get(0), -1, "capacity 0");
