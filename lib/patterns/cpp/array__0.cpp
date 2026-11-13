// A growable array from scratch: one heap block, a size and a capacity.
template <class T>
class DynamicArray {
    T* data = nullptr;
    size_t n = 0, cap = 0;

    void resize(size_t newCap) {                 // allocate a new block and move every item: O(n)
        T* fresh = new T[newCap];
        for (size_t i = 0; i < n; i++) fresh[i] = std::move(data[i]);
        delete[] data;
        data = fresh, cap = newCap;
    }

public:
    DynamicArray() { resize(1); }
    ~DynamicArray() { delete[] data; }
    DynamicArray(const DynamicArray&) = delete;  // one owner of the block
    DynamicArray& operator=(const DynamicArray&) = delete;

    size_t size() const { return n; }
    size_t capacity() const { return cap; }
    T& operator[](size_t i) { return data[i]; }   // start + i * sizeof(T): O(1), unchecked like std::vector
    T& at(size_t i) { if (i >= n) throw out_of_range("index"); return data[i]; }

    void push_back(const T& x) {
        if (n == cap) resize(2 * cap);           // doubling: O(1) amortised
        data[n++] = x;
    }
    void insert(size_t i, const T& x) {          // shift the tail right, from the back: O(n - i)
        if (i > n) throw out_of_range("index");
        if (n == cap) resize(2 * cap);
        for (size_t j = n; j > i; j--) data[j] = std::move(data[j - 1]);
        data[i] = x;
        n++;
    }
    T erase(size_t i) {                          // shift the tail left over the gap: O(n - i)
        if (i >= n) throw out_of_range("index");
        T x = std::move(data[i]);
        for (size_t j = i; j + 1 < n; j++) data[j] = std::move(data[j + 1]);
        n--;
        if (n > 0 && n <= cap / 4) resize(cap / 2);   // shrink at a quarter so we never thrash
        return x;
    }
    T pop_back() { return erase(n - 1); }
    long find(const T& x) const {                // linear search: O(n)
        for (size_t i = 0; i < n; i++) if (data[i] == x) return (long)i;
        return -1;
    }
};

// A hash map with separate chaining: a vector of buckets, each a list of (key, value).
template <class K, class V>
class HashMap {
    vector<list<pair<K, V>>> buckets = vector<list<pair<K, V>>>(8);
    size_t count = 0;

    list<pair<K, V>>& bucket(const K& key) { return buckets[std::hash<K>{}(key) % buckets.size()]; }
    void rehash() {                              // double the table and re-place every pair: O(n)
        vector<list<pair<K, V>>> old(buckets.size() * 2);
        swap(old, buckets);
        for (auto& chain : old)
            for (auto& kv : chain) bucket(kv.first).push_back(std::move(kv));
    }

public:
    size_t size() const { return count; }
    size_t bucketCount() const { return buckets.size(); }

    void put(const K& key, const V& value) {
        auto& b = bucket(key);
        for (auto& kv : b) if (kv.first == key) { kv.second = value; return; }   // overwrite
        b.push_back({key, value});
        if (++count * 4 > buckets.size() * 3) rehash();   // load factor above 0.75
    }
    optional<V> get(const K& key) {
        for (auto& kv : bucket(key)) if (kv.first == key) return kv.second;
        return nullopt;
    }
    bool contains(const K& key) { return get(key).has_value(); }
    bool remove(const K& key) {
        auto& b = bucket(key);
        for (auto it = b.begin(); it != b.end(); ++it)
            if (it->first == key) { b.erase(it); count--; return true; }
        return false;
    }
};
// @test
    DynamicArray<int> a;
    for (int x = 0; x < 5; x++) a.push_back(x);
    H::check(a.size(), (size_t)5, "size after 5 appends");
    H::check(a.capacity(), (size_t)8, "capacity doubled 1, 2, 4, 8");
    a.insert(0, 9); a.insert(3, 7);
    vector<int> got;
    for (size_t i = 0; i < a.size(); i++) got.push_back(a[i]);
    H::check(got, vector<int>{9, 0, 1, 7, 2, 3, 4}, "insert shifts the tail");
    H::check(a.erase(0), 9, "erase front");
    H::check(a.pop_back(), 4, "pop back");
    H::check(a.find(7), 2L, "find");
    H::check(a.find(42), -1L, "find missing");
    a.at(0) = 5;
    H::check(a[0], 5, "set through at");
    bool threw = false;
    try { a.at(99); } catch (const out_of_range&) { threw = true; }
    H::check(threw, true, "at checks bounds");
    while (a.size() > 1) a.pop_back();
    H::check(a.capacity(), (size_t)2, "shrinks at a quarter");

    HashMap<int, int> m;
    for (int i = 0; i < 20; i++) m.put(i, i * i);
    m.put(3, -1);
    H::check(m.get(3).value_or(0), -1, "overwrite");
    H::check(m.get(19).value_or(0), 361, "get");
    H::check(m.size(), (size_t)20, "map size");
    H::check(m.bucketCount(), (size_t)32, "rehash at load factor 0.75");
    H::check(m.remove(3), true, "remove");
    H::check(m.remove(3), false, "remove twice");
    H::check(m.contains(3), false, "gone");
    H::check(m.contains(4), true, "still there");
    HashMap<string, int> words;
    words.put("tea", 1); words.put("eat", 2);
    H::check(words.get("eat").value_or(0), 2, "string keys");
