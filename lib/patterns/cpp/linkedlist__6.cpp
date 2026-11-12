// LRU cache: std::list is a doubly linked list (most recent at the front), the map finds a key's node in O(1)
class LRUCache {
    int cap;
    list<pair<int, int>> order;                                   // (key, value), newest first
    unordered_map<int, list<pair<int, int>>::iterator> where;     // key -> its node in order
public:
    explicit LRUCache(int capacity) : cap(capacity) {}
    int get(int key) {
        auto it = where.find(key);
        if (it == where.end()) return -1;
        order.splice(order.begin(), order, it->second);           // move to front; iterators stay valid
        return it->second->second;
    }
    void put(int key, int value) {
        if (auto it = where.find(key); it != where.end()) {
            it->second->second = value;
            order.splice(order.begin(), order, it->second);
            return;
        }
        order.emplace_front(key, value);
        where[key] = order.begin();
        if ((int)where.size() > cap) {                            // evict the least recent: the back
            where.erase(order.back().first);
            order.pop_back();
        }
    }
};
// @test
    LRUCache c(2);
    c.put(1, 1); c.put(2, 2);
    H::check(c.get(1), 1, "get 1");
    c.put(3, 3);                                                  // evicts 2, since 1 was just used
    H::check(c.get(2), -1, "2 evicted");
    c.put(4, 4);                                                  // evicts 1
    H::check(c.get(1), -1, "1 evicted");
    H::check(c.get(3), 3, "get 3");
    H::check(c.get(4), 4, "get 4");
    LRUCache d(1);
    d.put(2, 1); d.put(2, 2);
    H::check(d.get(2), 2, "update in place");
    d.put(3, 3);
    H::check(d.get(2), -1, "capacity one");
