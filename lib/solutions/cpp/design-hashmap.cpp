class MyHashMap {
    static const int SIZE = 1009;                         // a prime spreads keys evenly
    vector<list<pair<int, int>>> buckets = vector<list<pair<int, int>>>(SIZE);
public:
    MyHashMap() {}

    void put(int key, int value) {
        auto& b = buckets[key % SIZE];
        for (auto& kv : b) if (kv.first == key) { kv.second = value; return; }
        b.push_back({key, value});
    }

    int get(int key) {
        for (auto& kv : buckets[key % SIZE]) if (kv.first == key) return kv.second;
        return -1;
    }

    void remove(int key) {
        buckets[key % SIZE].remove_if([&](const pair<int, int>& kv) { return kv.first == key; });
    }
};
// @test
    MyHashMap m;
    m.put(1, 1); m.put(2, 2);
    H::check(m.get(1), 1, "get 1");
    H::check(m.get(3), -1, "get missing");
    m.put(2, 1);
    H::check(m.get(2), 1, "overwrite");
    m.remove(2);
    H::check(m.get(2), -1, "removed");
    MyHashMap big;
    for (int k = 0; k < 1000000; k += 997) big.put(k, k + 1);
    H::check(big.get(997 * 500), 997 * 500 + 1, "many keys");
    H::check(big.get(5), -1, "many keys missing");
