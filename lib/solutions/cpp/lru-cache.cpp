class LRUCache {
    struct Node {
        int key, val;
        Node *prev = nullptr, *next = nullptr;
    };
    int cap;
    unordered_map<int, Node*> map;
    Node head{0, 0}, tail{0, 0};

    void unlink(Node* node) {
        node->prev->next = node->next;
        node->next->prev = node->prev;
    }
    void pushFront(Node* node) {
        node->prev = &head;
        node->next = head.next;
        head.next->prev = node;
        head.next = node;
    }

public:
    LRUCache(int capacity) : cap(capacity) {
        head.next = &tail;
        tail.prev = &head;
    }
    ~LRUCache() {
        for (auto& [k, node] : map) delete node;
    }

    int get(int key) {
        auto it = map.find(key);
        if (it == map.end()) return -1;
        unlink(it->second);
        pushFront(it->second);
        return it->second->val;
    }

    void put(int key, int value) {
        auto it = map.find(key);
        if (it != map.end()) {
            it->second->val = value;
            unlink(it->second);
            pushFront(it->second);
            return;
        }
        Node* node = new Node{key, value};
        map[key] = node;
        pushFront(node);
        if ((int)map.size() > cap) {
            Node* lru = tail.prev;
            unlink(lru);
            map.erase(lru->key);
            delete lru;
        }
    }
};
// @test
    LRUCache c(2);
    c.put(1, 1);
    c.put(2, 2);
    H::check(c.get(1), 1, "get 1");
    c.put(3, 3);
    H::check(c.get(2), -1, "evicted 2");
    c.put(4, 4);
    H::check(c.get(1), -1, "evicted 1");
    H::check(c.get(3), 3, "get 3");
    H::check(c.get(4), 4, "get 4");
    LRUCache d(1);
    d.put(2, 1);
    d.put(2, 2);
    H::check(d.get(2), 2, "update");
    d.put(3, 3);
    H::check(d.get(2), -1, "update evicted");
    H::check(d.get(3), 3, "get 3 cap 1");
