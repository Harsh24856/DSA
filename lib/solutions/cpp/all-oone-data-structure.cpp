class AllOne {
    struct Bucket {
        int count;
        unordered_set<string> keys;
        Bucket *prev = nullptr, *next = nullptr;
        Bucket(int c) : count(c) {}
    };
    Bucket *head, *tail;                    // sentinels, counts in increasing order between them
    unordered_map<string, Bucket*> at;      // key -> its bucket

    Bucket* addAfter(Bucket* b, int count) {
        Bucket* nb = new Bucket(count);
        nb->prev = b;
        nb->next = b->next;
        b->next->prev = nb;
        b->next = nb;
        return nb;
    }

    void drop(Bucket* b, const string& key) {
        b->keys.erase(key);
        if (b->keys.empty()) {   // unlink an empty bucket
            b->prev->next = b->next;
            b->next->prev = b->prev;
            delete b;
        }
    }

public:
    AllOne() : head(new Bucket(0)), tail(new Bucket(INT_MAX)) {
        head->next = tail;
        tail->prev = head;
    }

    void inc(string key) {
        auto it = at.find(key);
        Bucket* b = it == at.end() ? head : it->second;
        Bucket* nxt = b->next->count == b->count + 1 ? b->next : addAfter(b, b->count + 1);
        nxt->keys.insert(key);
        at[key] = nxt;
        if (b != head) drop(b, key);
    }

    void dec(string key) {
        Bucket* b = at[key];
        if (b->count == 1) {
            at.erase(key);
        } else {
            Bucket* prv = b->prev->count == b->count - 1 ? b->prev : addAfter(b->prev, b->count - 1);
            prv->keys.insert(key);
            at[key] = prv;
        }
        drop(b, key);
    }

    string getMaxKey() {
        return tail->prev != head ? *tail->prev->keys.begin() : "";
    }

    string getMinKey() {
        return head->next != tail ? *head->next->keys.begin() : "";
    }
};
// @test
    AllOne a;
    a.inc("hello");
    a.inc("hello");
    H::check(a.getMaxKey(), string("hello"), "max 1");
    H::check(a.getMinKey(), string("hello"), "min 1");
    a.inc("leet");
    H::check(a.getMaxKey(), string("hello"), "max 2");
    H::check(a.getMinKey(), string("leet"), "min 2");
    a.dec("hello");
    a.dec("hello");
    H::check(a.getMaxKey(), string("leet"), "max 3");
    a.dec("leet");
    H::check(a.getMaxKey(), string(""), "max empty");
    H::check(a.getMinKey(), string(""), "min empty");
