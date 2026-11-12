class MapSum {
    struct Node {
        unordered_map<char, Node*> next;
        int sum = 0;   // total value of keys through this node
    };
    Node root;
    unordered_map<string, int> vals;

public:
    MapSum() {}

    void insert(string key, int val) {
        int delta = val - vals[key];   // an existing key only adds the change
        vals[key] = val;
        Node* node = &root;
        for (char c : key) {
            Node*& nxt = node->next[c];
            if (!nxt) nxt = new Node();
            node = nxt;
            node->sum += delta;
        }
    }

    int sum(string prefix) {
        Node* node = &root;
        for (char c : prefix) {
            auto it = node->next.find(c);
            if (it == node->next.end()) return 0;
            node = it->second;
        }
        return node->sum;
    }
};
// @test
    MapSum m;
    m.insert("apple", 3);
    H::check(m.sum("ap"), 3, "ap 1");
    m.insert("app", 2);
    H::check(m.sum("ap"), 5, "ap 2");
    m.insert("apple", 1);
    H::check(m.sum("ap"), 3, "ap 3");
    H::check(m.sum("b"), 0, "b");
